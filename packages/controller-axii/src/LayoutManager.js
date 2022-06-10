import defaultAlias from "./styleAlias"

function createSimpleKeyToValue(key) {
  return {
    [key]: (...argv) => {
      // CAUTION 只有当 argv > 1 时才可能是字符串，例如 "space","between"。
      // 否则的话要保持原貌，不要用 join，因为针对数字系统会自动补全 px。如果用了join 就会变成字符串，系统就不能自动补全。
      return {
        [key] : argv.length > 1 ? argv.join('-') : argv[0]
      }
    }
  }
}

function createWithRange(name, handler = createSimpleKeyToValue) {
   return Object.assign({},
     handler(name),
     handler(`max-${name}`),
     handler(`min-${name}`),
     )
}

function createWithoutPrefixKeyToValue(prefix, name) {
  return {
    [name] : v => ({[`${prefix}-${name}`] : v})
  }
}

function createWithDirection(name, handler = createSimpleKeyToValue) {
  return Object.assign({},
    handler(name),
    handler(`${name}-top`),
    handler(`${name}-right`),
    handler(`${name}-bottom`),
    handler(`${name}-left`),
  )
}

const InlineRules = {
  __base: () => ({
     display: 'inline-block'
  }),
  display(...argv) {
    return { display:  argv.join('-')}
  },
  visible(type) {
    // display: none; visible:hidden
    if(type === 'none') {
      return { display: 'none' }
    } else if (type === 'hidden') {
      return { visibility: 'hidden'}
    }
  },
  ...createSimpleKeyToValue('position'),
  ...createWithDirection('margin'),
  ...createWithDirection('padding'),
  // CAUTION 注意，要配合 css reset 将所有默认值设置为 0。border width 默认是 3px，会导致只设置一个方向的时候，其他也跟着以 3px 显示出来了。
  ...createWithDirection('border', (key) => createSimpleKeyToValue(`${key}-width`)),
  ...createSimpleKeyToValue('white-space'),
  ...createSimpleKeyToValue('box-sizing'),
  ...createSimpleKeyToValue('line-height'),
  ...createSimpleKeyToValue('font-size'),
  ...createSimpleKeyToValue('overflow-x'),
  ...createSimpleKeyToValue('overflow-y'),
  ...createSimpleKeyToValue('left'),
  ...createSimpleKeyToValue('right'),
  ...createSimpleKeyToValue('top'),
  ...createSimpleKeyToValue('bottom'),
  ...createWithRange('width'),
  ...createWithRange('height'),
}

const BaseDefaultRules = {
  block: {
    ...InlineRules,
    __base: () => ({
      display: 'block'
    }),
  },
  inline: InlineRules,
  text: {
    __base: () => ({
      display: 'inline'
    }),
  },
}

const createFlexProperty = (name) => createWithoutPrefixKeyToValue('flex', name)
// flex 的处理
const LayoutRules = {
  table: {
    layout(value) {
      return {'table-layout': value}
    },
    ...createSimpleKeyToValue('border-spacing'),
    ...createSimpleKeyToValue('border-collapse'),
  },
  flex: {
    display() {
      return { display : 'flex'}
    },
    'display-inline': () => {
      return { display : 'inline-flex'}
    },
    ...createFlexProperty('basis'),
    ...createFlexProperty('grow'),
    ...createFlexProperty('direction'),
    ...createFlexProperty('shrink'),
    ...createFlexProperty('wrap'),
    ...createSimpleKeyToValue('gap'),
    ...createSimpleKeyToValue('order'),
    ...createSimpleKeyToValue('justify-content'),
    ...createSimpleKeyToValue('align-content'),
    ...createSimpleKeyToValue('align-items'),
    ...createSimpleKeyToValue('align-self'),
  }
}

function matchRule(flatRules, inputKeys) {
  const keys = [...inputKeys]
  const argv = []
  while(!flatRules[keys.join('-')] && keys.length) {
    const currentArgv = keys.pop()
    argv.unshift(currentArgv)
  }
  return [flatRules[keys.join('-')], argv]
}

function flatten(obj, parentPath=[], result = {}) {
  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === 'object') {
      flatten(value, parentPath.concat(key), result)
    } else {
      result[parentPath.concat(key).join('-')] = value
    }
  })
  return result
}

const NAMESPACE = 'layout'

function getPrefix(attributes) {
  if (attributes.inline) return 'inline'
  if (attributes.block) return 'block'
  if (attributes.text) return 'text'
  return ''
}

/**
 * Layout 用法:
 * 类似于 Style，但是在组件内部是写在 render 函数里的。
 * 这里暴露 Layout 是让外部有机会通过替换 Layout 来动态修改部分值。
 *
 * TODO 伪类的处理。:hover？？？
 *  伪类的本质：
 *  1. 结构型的，已经有 fragments 里面可以拿到参数了，不许奥
 *  2. 用户交互型的，例如 hover，需要注册事件，或者直接使用 css。最好的写法应该是 elements.xxx.activeStyle()。不要和 style 混合。
 *
 */
// TODO restrictions。要支持 base 的模式选择。例如 inline 下不能有 block-xxx。这可能需要 vnode 上又 parent。否则像 flex 的 restriction 没法做。
export default class LayoutManager {
  constructor(baseRules = BaseDefaultRules, layoutRules = LayoutRules) {

    this.baseRuleTypes = Object.keys(baseRules)
    this.flatRules = flatten(Object.assign({}, baseRules, layoutRules))
    // this.layoutRules = layoutRules
  }

  configAlias(styleAlias) {
    this.styleAlias = styleAlias
  }

  match(vnode) {
    return this.baseRuleTypes.includes(vnode.type) || this.baseRuleTypes.some(type => type in (vnode.attributes || {}))
  }

  processLayoutProps(props) {
    const layoutProps = {}
    const originProps = {}
    Object.entries(props).forEach(([key, value]) => {
      const namespaceTest = new RegExp(`^${NAMESPACE}:`)
      if (namespaceTest.test(key)) {
        layoutProps[key.replace(namespaceTest, '')] = value
        originProps[key] = value
      }
    })
    return Object.keys(layoutProps).length ? [layoutProps, originProps] : [undefined]
  }

  processAlias(key, prefix) {
    let attr = key
    let val = null
    const styleAlias = Object.assign({}, defaultAlias, this.styleAlias)
    const config = styleAlias[key]
    if (!config) return {}

    if (typeof config === 'object') {
      const keys = Object.keys(config)
      if (keys.length) {
        attr = keys[0]
        val = config[attr]
      }
    } else {
      attr = config
    }
    // CAUTION: 这里用 InlineRules 来判断是否添加前缀有点 trick，因为 LayoutManager 本来是不感知 rules 内部规则的，暂时先这样
    if (InlineRules[attr]) attr = `${prefix}-${attr}`
    return { attr, val }
  }

  parse(attributes, vnode) {
    const style = {}
    let hasStyle = false
    const prefix = getPrefix(attributes)
    Object.entries(attributes).forEach(([key, value]) => {
      let shouldApply = value
      const { attr, val } =  this.processAlias(key, prefix)
      if (val) shouldApply = val

      let keys = (attr || key).split('-')
      const len = keys.length

      // alias-val 类型（如 p-2px)
      if (!attr && len > 1 && shouldApply === true) {
        const val = keys.pop()
        const alias = keys.join('-')
        const { attr } = this.processAlias(alias, prefix)
        if (attr) {
          keys = [...attr.split('-'), val]
        } else {
          keys.push(val)
        }
      }
      // 有名字的组件会有个 block=true 这样的，过滤掉。
      const keysToMatch = len < 2 ? [keys[0], '__base'] : keys

      const [fn, argv] = matchRule(this.flatRules, keysToMatch)
      if (fn) {
        hasStyle = true
        // 例如 block-display-none={false} 这种情况说明要取消掉这个 style。argv !== 0 说明已经在前面读到 'none' 这个参数。
        // 改成 undefined 说明要删除这些属性
        const styleArgv = typeof shouldApply === 'boolean' ? argv : argv.concat(shouldApply)
        const partialStyle = fn(...styleArgv)
        if (shouldApply === false && argv.length !== 0) {
          Object.keys(partialStyle).forEach(k => {
            // CAUTION  注意这里一定要有这个判断，因为可能多个规则操作统一个属性，例如
            // display 可以被 flex 等操作，如果之前有别的规则操作了，那么自然会被复写掉，就不用设置 undefined 来清除了。
            if (!style.hasOwnProperty(k) ) {
              partialStyle[k] = undefined
            } else {
              // 如果有的话，就不用管了
              delete partialStyle[k]
            }
          })
        }
        Object.assign(style, partialStyle)
      }


    })

    return hasStyle ? style : undefined
  }
}