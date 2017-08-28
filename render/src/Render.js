/**
 * Render 是整个金蝉渲染的根节点组件。内部机制和 Redux Provider 差不多，在 context
 * 提供了 stateTree 等"全局数据"。它有两种使用方式:
 * 1. 接受 object 形式的 config。例如: <Render components={{}} config={{}} stateTree={{}} />
 * 2. 传统的手动组件的方式。例如:
 *   <Render>
 *     <Button bind="button1"/>
 *     <Button bind="button2"/>
 *   </Render>
 * 手动模式下任何子组件都应该是一个已经使用 connect 链接过的 container。
 *
 * 无论哪种方式，Render 都支持受控和非受控两种形式。支持受控主要是因为内部实现了一个 fragment
 * 机制，即把部分片段封装起来也变成一个金蝉组件，片段中也使用 Render。由于金蝉组件必须是受控组件，
 * 所以 Render 必须实现受控模式。受控模式标记属性是 onChange，传入了 onChange 就会让其编程受控态。
 *
 * Render 除了负责提供 context 外，剩下的工作主要是创建扁平树。当然，如果是第二种手动方式，扁平树
 * 是用户自己创建的。
 *
 * 阅读完 Render 代码后建议阅读 connect 代码。它主要负责从 context 上取数据给组件。
 */
import React from 'react'
import PropTypes from 'prop-types'
import createBackground from './createBackground'
import createFlatTree from './createFlatTree'
import { PRIMITIVE_COMPONENTS } from './constant'
import { createUniqueIdGenerator } from './util'

const createRenderId = createUniqueIdGenerator('r')

function patchPath(children, parentComponentPath = []) {
  if (children === undefined) return undefined
  return React.Children.map(children, (child, index) => {
    if (typeof child !== 'object' || child.props.path !== undefined) return child
    const path = parentComponentPath.concat(index)
    const props = {
      children: patchPath(child.props.children, path),
    }
    if (PRIMITIVE_COMPONENTS[child.type] === undefined) {
      props.path = path
    }
    return React.cloneElement(child, props)
  })
}

export default class Render extends React.Component {
  static defaultProps = {
    appearance: {
      register() {
        return {
          cancel() {},
          hijack: render => render,
        }
      },
    },
    config: undefined,
    components: undefined,
    onChange: undefined,
    didMount: undefined,
  }
  static propTypes = {
    stateTree: PropTypes.object.isRequired,
    appearance: PropTypes.object,
    config: PropTypes.object,
    components: PropTypes.object,
    didMount: PropTypes.func,
    // CAUTION 这个字段决定了整个 Render 是不是受控的，fragment 和 动态组件就是受控的
    onChange: PropTypes.func,
  }
  static childContextTypes = {
    stateTree: PropTypes.object,
    appearance: PropTypes.object,
    components: PropTypes.object,
    getScopes: PropTypes.func,
    getStatePath: PropTypes.func,
    background: PropTypes.object,
    onChange: PropTypes.func,
    getRenderScopes: PropTypes.func,
  }
  static contextTypes = {
    components: PropTypes.object,
    getRenderScopes: PropTypes.func,
  }
  constructor() {
    super()
    this.id = createRenderId()
  }

  getChildContext() {
    const { getRenderScopes: getParentRenderScopes = () => [] } = this.context

    return {
      stateTree: this.stateTree,
      appearance: this.appearance,
      components: this.components,
      getScopes: () => [],
      getStatePath: () => '',
      background: this.background,
      onChange: this.props.onChange,
      getRenderScopes: () => getParentRenderScopes().concat(this.id),
    }
  }

  componentWillReceiveProps() {
    // 这里才真的通知子组件开始渲染
    if (!this.isControlled) {
      this.stateTree.flush()
    }
  }

  componentDidMount() {
    if (this.props.didMount) {
      this.props.didMount(this.background.instances)
    }
    this.background.onSteady()
  }

  componentDidUpdate() {
    if (this.props.didUpdate) {
      this.props.didUpdate(this.background.instances)
    }
    this.background.onSteady()
  }

  render() {
    const { stateTree, components, background, appearance } = this.props
    const { components: parentComponents } = this.context
    this.stateTree = stateTree
    this.appearance = appearance
    this.components = components || parentComponents
    this.background = background || createBackground()

    return this.props.config === undefined ? <div>{patchPath(this.props.children)}</div> : createFlatTree(this.components, undefined, this.props.config, undefined)
  }
}
