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

/**
 * 创建一个 proxy 用来记录用户所有的 style 规则。
 * 这个 proxy 会递归的去创建，把路径上的信息都记录下来，例如：
 * style.selector1.selector2 实际上创建了 selector1 selector2 这li两个 proxy。
 * style 是 StyleRoot 类型，最终信息都记在了 styleRoot 上。
 *
 * selector 可以写成 selector1[active=true] 的形式，就像 css 一样，active 是这个 selector 上的变量。
 * 我们的 proxy 其实只是一个 规则收集器，并不遵循对象赋值的规律，所以可以写成:
 *
 * style.selector1.selector2 = {
 *   color: blue
 * }
 *
 * style.selector1 = {
 *   color: red
 * }
 *
 * 不会产生覆盖。
 */
function createStyleProxy(root= new StyleRoot(),parentPath = []) {
  const traps = {
    get(target, key) {
      return (root[key] !== undefined) ? root[key] : createStyleProxy(root, parentPath.concat(key))
    },
    set(target, key, value) {
      if (value['@define'] !== undefined) {
        invariant(parentPath.length === 0, '@define can only be used with tagName')
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

/**
 * scope style 是通过在组件里面的每个节点都打上 data-scopeId 实现的。
 * 所以这里的 selector 也使用这个。
 */
function getScopeSelector(scopeId) {
  // CAUTION 特别注意这里驼峰会变成 -
  return `[data-scope-id="${scopeId}"]`
}

function resolveSelector(rawInputSelector, scopeId) {
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
            result[index] = `${p.resolve(...currentArgv)}${getScopeSelector(scopeId)}`
          }
        })

        return result.join(' ')
      }
    }]
  } else {
    return [resolvedSelectorPieces.map(piece => `${piece}${getScopeSelector(scopeId)}`).join(' ')]
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
 * 实现 StyleManager 的核心思路：样式组织代码的维度应该按照 dom/attr 所受的影响写在一起，而不是按结构组织。
 * 例如 style.selector1 和 style.selector1.selector2.selector3 都受到某个变量影响，那么就应该写在一起。
 *
 * 以下写法中的 selector 就像 css selector 一样，可以通过 . 表示层级。
 * style.selector1.selector2 就像 css 中的 "selector1 selector2" 一样。
 *
 * 写法:
 * 1. 普通
 * style.selector = {}
 * 2. 要参数。使用 @define 可以定义参数，接下来就能在同级或者后面的 selector 中用了
 * style.selector = {
 *   '@define': { arguments }
 * }
 * 3. 用参数，可以直接写在 attribute 上，在后面的 function 中就会按顺序接收到，在函数中根据参数不同可以返回不同的值。
 * style.selector = {
 *   'color[active]': function(active) {}
 * }
 * 4. 参数有值。直接对参数为某一个固定值的情况进行赋值，这通常适合于参数是可枚举的情况。
 * style.selector = {
 *   'color[active=true]' : 'red'
 * }
 *
 * 5. 级联
 * style.selector1.selector = {}
 *
 * 6. 级联中有参数
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
 * StyleManager 具体实现：
 * 1. 在 constructor 中直接关在了一个 styleSheet，用来实现样式控制。
 * 2. cnode 上的 Style 函数里面就是对 styleRoot 使用，执行一次就能收集到所有样式。
 * 3. 通过 styleManager.digest(Style) 来执行 Style，得到样式，并且挂载在 stylesheet 上。
 * 4. 当 cnode 变化时，又会重新执行 digest(cnode)，重新得到样式并且应用。因为插入到 stylesheet 上可以覆盖前面的规则。所以不用考虑删除前面的。
 * CAUTION 这里重复执行 Style 的时机，外来可能可以通过 vnodeComputed 根据数据变化决定，提升性能。
 *
 * scope style 的实现，是通过在每个 dom 上打上 [data-scope-id="xxx"] ，
 * 同时我们在生成的样式里面也 selector 都加上对相应的 [data-scope-id="xxx"] 来实现的。
 *
 * 哪些 style 适合放在 StyleManager 里？
 * 虽然所有的样式都可以放到里面，但是我们推荐：
 * 将跟"元素位置信息"有关的 style（如 display）放到 vnode 上，由 LayoutManager 管理。
 * 其他的放到 StyleManager 中。区分的思路在于：
 * 用户依据什么来判断是不是同一个组件？主要是由组成组件的元素的位置来判断的。整个组件大一点还是小一点、
 * 颜色如何，都不易影响用户的判断。
 * 因此一般将 display/width/height/padding/margin/border-width 这些肯定会、或者可能影响元素布局的
 * style 放到 LayoutManager 中. 其中除了 display，后面的几个都是"可能会"影响父子、兄弟节点的位置。
 * 注意，虽然 font-size、line-height 也可能影响，但从语义上来说，字体行高大一点还是小一点，用户也应该认为是同一个组件。
 *
 * TODO
 * 1. selector 上的 var 从哪里来？
 * 2. 怎么写才体验最好
 * 3. 能否解决所有的问题。
 */
export default class StyleManager{
  constructor(doc = document) {
    this.styleToStyleEle = new WeakMap()

    // setup sheet
    this.doc = doc
    const style = this.doc.createElement('style')
    this.doc.head.appendChild(style)
    this.sheet = style.sheet
  }
  createStyleEle() {
    const style = this.doc.createElement('style')
    this.doc.head.appendChild(style)
    return style
  }
  digest(Style, scopeId) {

    let styleEle = this.styleToStyleEle.get(Style)
    if (styleEle) return
    this.styleToStyleEle.set(Style, styleEle = this.createStyleEle())


    const styleProxy = createStyleProxy(new StyleRoot())
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

      const [selector, selectorResolver] = resolveSelector(inputSelector, scopeId)
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
