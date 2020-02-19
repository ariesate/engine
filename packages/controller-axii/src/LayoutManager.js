import { invariant } from './util';

function createSimpleKeyToValue(key) {
  return {
    [key]: v => ({[key] : v})
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
  visible(type) {
    // display: none; visible:hidden
    if(type === 'none') {
      return { display: 'none' }
    } else if (type === 'hidden') {
      return { visibility: 'hidden'}
    }
  },
  ...createWithDirection('margin'),
  ...createWithDirection('padding'),
  ...createWithDirection('border', (key) => ({ [key]: v => ({[`${key}-width`]: v }) })),
  ...createSimpleKeyToValue('white-space'),
  ...createSimpleKeyToValue('line-height'),
  ...createSimpleKeyToValue('font-size'),

}

const BaseDefaultRules = {
  block: {
    ...InlineRules,
    ...createWithRange('width'),
    ...createWithRange('height'),
    ...createSimpleKeyToValue('overflow-x'),
    ...createSimpleKeyToValue('overflow-y'),
  },
  inline: InlineRules,
  text: {}
}

const createFlexProperty = (name) => createWithoutPrefixKeyToValue('flex', name)
// flex 的处理
const LayoutRules = {
  flex: {
    display() {
      return { display: 'flex'}
    },
    ...createFlexProperty('basis'),
    ...createFlexProperty('grow'),
    ...createFlexProperty('direction'),
    ...createFlexProperty('shrink'),
    ...createFlexProperty('wrap'),
    ...createSimpleKeyToValue('order'),
    ...createSimpleKeyToValue('justify-contents'),
    ...createSimpleKeyToValue('align-contents'),
    ...createSimpleKeyToValue('align-items'),
    ...createSimpleKeyToValue('align-self'),
  }
}

function matchRule(flatRules, inputKeys) {
  const keys = [...inputKeys]
  const argv = []
  while(!flatRules[keys.join('-')] && keys.length) {
    const currentArgv = keys.pop()
    argv.push(currentArgv)
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

// TODO restrictions。要支持 base 的模式选择。例如 inline 下不能有 block-xxx。这可能需要 vnode 上又 parent。否则像 flex 的 restriction 没法做。
export default class LayoutManager {
  constructor(baseRules = BaseDefaultRules, layoutRules = LayoutRules) {

    this.baseRuleTypes = Object.keys(baseRules)
    this.flatRules = flatten(Object.assign({}, baseRules, layoutRules))
    // console.log(Object.keys(this.flatRules))
    // this.layoutRules = layoutRules
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
  parse(attributes, vnode) {
    const style = {}
    let hasStyle = false
    Object.entries(attributes).forEach(([key, shouldApply]) => {
      const keys = key.split('-')
      // 有名字的组件会有个 block=true 这样的，过滤掉。
      if (keys.length < 2) return

      const [fn, argv] = matchRule(this.flatRules, keys)
      if (fn) {
        hasStyle = true
        // 例如 block-display-none={false} 这种情况说明要取消掉这个 style。argv !== 0 说明已经在前面读到 'none' 这个参数。
        // 改成 undefined 说明要删除这些属性
        const partialStyle = fn(...argv, shouldApply)
        if (shouldApply === false && argv.length !== 0) {
          Object.keys(partialStyle).forEach(k => {
            partialStyle[k] = undefined
          })
        }
        Object.assign(style, partialStyle)
      }
    })

    return hasStyle ? style : undefined
  }
}