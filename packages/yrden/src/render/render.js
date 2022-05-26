import { createElement, Fragment, reactive, propTypes } from 'axii'
import { mapValues, createUniqueIdGenerator } from '../util'

const createGlobalID = createUniqueIdGenerator('i')

export const SCHEMA_NODE_ID_STATE_NAME = 'schemaNodeId'
// 针对组件 repeat 的情况
export const SCHEMA_NODE_INDEX_STATE_NAME = 'schemaNodeIndex'

/**
 * TODO 要 check 一下 rerender 的范围
 */

export function render(schema, components) {

  const stateTree = {}
  // TODO
  const extendCallbackAndBinding = (state, props) => {
    // 1. 把 stateTree, 当前 state 当默认参数传到所有 function 里面.
    // 2. stateTree 要搞个更好用的 proxy, 提供 merge 等基本功能。提供 parent，
    //  find，等反射查询功能。
    return props
  }

  // TODO
  const createDefaultPropTypes = (Component, props) => {
    return props || {}
  }

  // 所有的 util 都写到这个 extend 里面。render 只处理 render 和构建 stateTree 的过程。
  //  支持 visible/repeat 被认为是最近本的结构编程的能力，所以也放在里面
  const utils = {
    extendCallbackAndBinding,
    createDefaultPropTypes
  }

  return recursiveRender(schema, components, stateTree, utils)
}

function renderOne({ component, visibleType, visibleControl, children, props, id }, components, state, utils, repeatIndex) {
  const Component = components[component]
  const extendedProps = utils.extendCallbackAndBinding(state, props)
  const current = createElement(
    Component,
    {
      ...state,
      ...extendedProps,
      [SCHEMA_NODE_ID_STATE_NAME] : id,
      key: id,
      [SCHEMA_NODE_INDEX_STATE_NAME] : repeatIndex,
    },
    (Component?.propTypes?.children?.is?.(propTypes.shapeOf) && !Array.isArray(Component?.propTypes?.children?.argv[0])) ?
      mapValues(children || {}, child => recursiveRender(child, components, state, utils)) :
      () => {
        return (children || []).map(child => recursiveRender(child, components, state, utils))
      }
  )

  return visibleType === 'data' ?
      (visibleControl() ? current : null) :
      current

  // TODO bug，这里 visibleType 是可能变化的，应该也能写成 computed 的形式控制范围
  // return () => visibleType === 'data' ?
  //     (visibleControl() ? current : null) :
  //     current
}

function recursiveRender(schema, components, stateParent, utils){
  
  if (typeof schema !== 'object') return schema

  // CAUTION  副作用
  if(!schema.id) schema.id = createGlobalID()

  const {
    component,
    repeat,
    name,
    props,
    customRender
  } = schema

  // 1. 如果是个完全动态的结构？动态的结构封装成了 Component。这样这里就不用特殊处理了。
  // 2. 如果是个 Virtual Group，那么 Component 就是 Fragment。对于需要处理根据子元素
  //  的尺寸来出来的组件，在内不要先通过 flattenChildren 拿到 flatten 之后的值，
  //  然后加 ref 渲染
  // 3 通过 layout:block-display 来控制 visible
  // 4. TODO 如果是 repeat， repeat 怎么挂载数据呢？？？TODO还要增加 key 处理

  // 5. 还要增加生命周期，当组件写在的时候要把 stateTree 上面数据也移除掉。
  //  repeat 不用考虑，
  //  因为 repeat 组件的写在是通过处理数据来移除的。
  //  TODO 这里要考虑的是通过 visibleControl 处理的组件当 visibleControl 变化时，
  //   如何卸载数据？

  // 完全自己处理，在这里面再去决定怎么根据 stateTree 如何返回。
  const Component = components[component]
  // TODO 参数改正确
  if(customRender) return customRender(schema, utils)



  // 全部编程 delegate 模式
  const state = repeat ?
    reactive([]) :
    utils.createDefaultPropTypes(Component, props)
  if (!stateParent._children_) stateParent._children_ = {}
  stateParent._children_[name] = state

  if (!repeat) {
    // 6. TODO callback 和 props 的数据绑定绑定怎么处理？？？
    return renderOne(schema, components, state, utils)

  } else {
    // 注意这里children map 里面返回另一个函数的写法，这样可以控制最小力度更新。
    //  这样动态组件在使用的时候，config 的局部变化就可以最小力度地更新了。

    // visible 是在 repeat上还是在每一个单独的上？应该是每一个单独的上。
    //  如果要控制整个 repeat，那么当前节点应该是个 Group。
    // TODO props 改正确
    return () => state.map((childState, index) => {
      return renderOne(schema, components, childState, utils, index)
    })
  }
}