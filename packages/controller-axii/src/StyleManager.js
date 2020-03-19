import { each, invariant, map } from './util';

export function StyleEnum(...values) {
  return {values}
}

export class StyleRule {
  constructor(vars, handle) {
    this.vars = vars
    this.handle = handle
  }
}


class StyleRoot {
  constructor() {
    this.rules = []
    this.vars = {}
  }
  add(path, value) {
    // 相同规则只允许有一条
    this.rules.push([path, value])
  }
  addVar(selector, varDef) {
    this.vars[selector] = varDef
  }
  getRules() {
    return this.rules
  }
  getVars() {
    return this.vars
  }
}


function createStyleProxy(root= new StyleRoot(),parentPath = []) {
  const traps = {
    get(target, key) {
      return (root[key] !== undefined) ? root[key] : createStyleProxy(root, parentPath.concat(key))
    },
    set(target, key, value) {
      if (value['@define'] !== undefined) {
        invariant(parentPath.length === 0, '@define can only used in tagName')
        root.addVar(key, value['@define'])
        delete value['@define']
      }

      const varSelectors = {}

      Object.entries(value).forEach(([inputAttrName, attrValue]) => {
        // 因为 attr 上也可能有 var，因此借助 parseSelector parse 一下。
        // style.two = { color[active]: function(active) {} }
        // 变成 two[active] = { color: function(){} }
        const { tag: attrName } = parseSelector(inputAttrName)
        if (attrName !== inputAttrName) {
          const varSelector = inputAttrName.replace(new RegExp(`^${attrName}`), '')
          if (!varSelectors[varSelector]) varSelectors[varSelector] = {}
          varSelectors[varSelector][attrName] = attrValue
          delete value[inputAttrName]
        }
      })

      if (Object.keys(value).length) {
        root.add(parentPath.concat(key), value)
      }

      if (Object.keys(varSelectors).length) {
        Object.entries(varSelectors).forEach(([varSelector, attrs]) => {
          root.add(parentPath.concat(`${key}${varSelector}`), attrs)
        })
      }

      return true
    }
  }
  return new Proxy({}, traps)
}


const CSS_PSUEDO_CLASS = [':hover', ':link', ':visited', ':active']

function parseSelector(selector) {
  const resolvedVars = {}
  const unresolvedVars = []
  let tag

  const inputVar = selector.match(/\[([a-zA-Z0-9,=]+)\]/g)
  if (!inputVar) {
    tag = selector
  } else {
    inputVar.forEach((varStr) => {
      // 去掉两边的 []
      const [key, value] = varStr.slice(1, varStr.length - 1).split('=')
      if (value === undefined) {
        unresolvedVars.push(key)
      } else {
        resolvedVars[key]=value
      }
    })
    tag = selector.slice(0, selector.indexOf('['))
  }

  const resolve = (...argv) => {
    invariant(argv.length === unresolvedVars.length, 'input vars not equal to unresolved vars')
    const vars = { ...resolvedVars }
    unresolvedVars.forEach((varName, index) => {
      vars[varName] = argv[index]
    })
    return `${tag}${map(vars, (v, k) => `[var-${k}=${v}]`).join('')}`
  }

  return {tag, resolvedVars, unresolvedVars, resolve}
}

function resolveSelector(rawInputSelector) {
  const inputSelector = [...rawInputSelector]
  const resolvedSelectorPieces = []

  inputSelector.forEach((selectorPiece) => {
    const parsedSelector = parseSelector(selectorPiece)
    const {tag, unresolvedVars, resolve} = parsedSelector
    if (tag === selectorPiece) {
      resolvedSelectorPieces.push(selectorPiece)
    } else {
      // 有参数
      if (unresolvedVars.length !== 0) {
        // 当前没有 resolve, 把计算的值扔进去。之后不用再算了。
        resolvedSelectorPieces.push(parsedSelector)
      } else {
        // 当前所有变量都 resolve 了。还是要使用 resolve，因为要在变量前加前缀 var-
        resolvedSelectorPieces.push(resolve())
      }
    }
  })

  if (resolvedSelectorPieces.some(p => typeof p === 'object')) {
    return [undefined, {
      get vars() {
        const allVars = []
        resolvedSelectorPieces.forEach((p) => {
          if (typeof p === 'object') {
            // 这是 applyDecare 要的格式
            const withTag = p.unresolvedVars.map(varName => [p.tag, varName])
            allVars.push( ...withTag)
          }
        })
        return allVars
      },
      resolve(...argv) {
        // CAUTION  一定要复制一下，因为 resolve 要用多次，不要动到源对象上任何引用。
        let readArgvIndex = 0
        const result = [...resolvedSelectorPieces]
        result.forEach((p, index) => {
          if (typeof p === 'object') {
            // 这是 applyDecare 要的格式
            const currentArgv = argv.slice(readArgvIndex, readArgvIndex + p.unresolvedVars.length)
            readArgvIndex += p.unresolvedVars.length
            result[index] = p.resolve(...currentArgv)
          }
        })

        return result.join(' ')
      }
    }]
  } else {
    return [resolvedSelectorPieces.join(' ')]
  }
}

function applyDecare(unResolvedVars, getOptions, fn, resolvedVars = []) {
  if (unResolvedVars.length === 0) return fn(...resolvedVars)

  const varValueOptions = getOptions(unResolvedVars[0])
  varValueOptions.forEach(option => {
    applyDecare(unResolvedVars.slice(1), getOptions, fn, resolvedVars.concat(option))
  })
}

/**
 * 核心原则：组织代码的维度应该是 dom/attr 受什么影响，应该写在一起。而不是按结构组织。
 * 所以第一层是 dom 和 各种级联情况下的 dom。
 * 第二层是 attr, 和各种情况下的attr。
 *
 * 写法:
 * 1. 普通
 * style.selector = {}
 * 2. 要参数
 * style.selector = {
 *   '@define': { arguments }
 * }
 * 3. 用参数
 * style.selector = {
 *   'color[active]': function(active) {}
 * }
 * 4. 参数有值
 * style.selector = {
 *   'color[active=true]' : 'red'
 * }
 *
 * 5. 级联
 * style.selector1.selector = {}
 *
 * 6. 级联要参数
 * style.selector1[active].selector = {
 *   color(active) {},
 *   background(active) {},
 * }
 *
 * 7. 级联参数有确定值
 * style.selector1[active=true].selector = {}
 *
 * 8. 级联参数要取不确定值
 * style.selector1[active].selector = {
 *   attr: function(active) {}
 * }
 *
 * CAUTION 去掉了伪类的概念，全部让用户通过 props\参数 来实现。
 *
 */
export default class StyleManager{
  constructor() {
    this.cnodeToStyle = new Map()
    this.styleToStyleEle = new Map()

    // setup sheet
    const style = document.createElement('style')
    document.head.appendChild(style)
    this.sheet = style.sheet
  }
  createStyleEle() {
    const style = document.createElement('style')
    document.head.appendChild(style)
    return style
  }
  add(cnode) {
    if(this.cnodeToStyle.get(cnode)) return
    const { Style } = cnode.type
    if (!Style) return

    this.cnodeToStyle.set(cnode, Style)
  }
  digest(cnode) {
    const Style = this.cnodeToStyle.get(cnode)
    if (!Style) return

    let styleEle = this.styleToStyleEle.get(Style)
    if (styleEle) return
    this.styleToStyleEle.set(Style, styleEle = this.createStyleEle())


    const styleProxy = createStyleProxy()
    Style(styleProxy)
    const rules = styleProxy.getRules()
    const definedVars = styleProxy.getVars()

    const resolvedRules = []

    rules.forEach(([inputSelector, value]) => {
      /**
       * selector 是个数组，可能含有：
       * 1. 正常 tagName
       * 2. 有参数 tagName(varName)
       * 3. 参数有值 tagName(varName=value)
       *
       * value 是个对象，可能情况:
       * 1. 正常 attrName: value,
       * 2. 参数定义 @define: { varName: options[] }
       * 3. 带参数，attrName(varName): function(varName)
       * 4. 参数带值。attrName(varName=value): value
       */

      const [selector, selectorResolver] = resolveSelector(inputSelector)
      if (!selector) {
        // 如果不能 resolve, 说明需要运算
        applyDecare(selectorResolver.vars, (([tag, varName]) => definedVars[tag][varName]), (...argv) => {
          const resolvedSelector = selectorResolver.resolve(...argv)
          const resolvedValue = {}
          let hasValue = false
          Object.entries(value).forEach(([attrName, attrFn]) => {
            const attrValue = attrFn(...argv)
            if (attrValue !== undefined) {
              hasValue = true
              resolvedValue[attrName] = attrValue
            }
          })
          if (hasValue) {
            resolvedRules.push([resolvedSelector, resolvedValue])
          }
        })
      } else {
        resolvedRules.push([selector, value])
      }
    })

    resolvedRules.forEach(([selector, rule]) => {
      styleEle.sheet.insertRule(selector + this.stringifyRule(rule))
    })

  }
  stringifyRule(ruleObject) {
    return `{
      ${Array.from(Object.entries(ruleObject)).map(([inputKey, inputValue]) => {
        const key = inputKey.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
        const value = typeof inputValue === 'number' ? `${inputValue}px` : inputValue
        return `${key}:${value}`
      }).join(';')}
    }`
  }
}
