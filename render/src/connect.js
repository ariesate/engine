/**
 * connect 主要负责三件事:
 * 1. 处理组件的数据。包括首次 render 时把数据注册到 stateTree 中，收到变化时从 stateTree 上取数据传给组件
 * 2. 处理组件的交互行为。包括包装 listener，intercepter 等。其中比较重要的是包装过成中还要考虑到组件的
 * 受控态和非受控态。在受控状态下修改数据的部分被包装成一个一个 changeFn ，留给外部调用。这个机制在复合组件中用到了
 * 3. 和 Render 一起，提供了 background 机制。将 background 作为注入参数供用户使用。
 *
 * 阅读 connect 中要提前熟悉的概念有 "react-lego" 规范和 "global state tree"。
 * react-lego 规定了以声明式的方式来声明组件的state、render、和listener。这样，
 * 我们才能将 state 和 listener 拿到全局来处理，构建 global state tree。有了 global state tree，
 * 剩下的 background 等高级功能就非常容易实现了，connect 也只需要管如何从 state tree 拿数据
 * 传给组件就够了。
 *
 * 阅读完 connect 后，建议阅读 createStateTree 和 createBackground。
 */
import React from 'react'
import PropTypes from 'prop-types'
import { pick, mapValues, each, isNegative, concat, inject, createUniqueIdGenerator, partial, filter, shallowEqual } from './util'
import { ErrorWrongScopeIndex } from './errors'
import { resolveStatePath, StatePath } from './common'
import { primitiveFnNames, REASON_DEFAULT_LISTENER, DISPLAY_BLOCK, CHANGE_STATETREE, CHANGE_APPEARANCE } from './constant'

function seal(fn) { return () => fn() }

function createIdentifierComponent(identifier) {
  const Identifier = () => null
  Identifier.__base = identifier
  return Identifier
}

const createComponentId = createUniqueIdGenerator()

export default function connect(DeclarativeComponent, displayName) {
  const {
    // TODO 用来做 state 校验
    // stateTypes = {},
    getDefaultState = () => ({}),
    defaultListeners = {},
    // CAUTION 注意组件里面都拼错了，找时间一起改过来
    defaultIntercepters = {},
    identifiers = {},
    initialize = () => ({}),
    render = () => null,
    // CAUTION 为 stateTree 模式新增的 lifecycle。用于告诉组件自己是不是被定点更新
    componentWillReceiveState,
    shouldComponentUpdate,
    display = DISPLAY_BLOCK,
  } = DeclarativeComponent

  const primitiveFns = pick(DeclarativeComponent, primitiveFnNames)

  class Wrapper extends React.Component {
    static displayName = displayName
    static contextTypes = {
      // 用于获取上面层级所有可用的 scope
      getScopes: PropTypes.func.isRequired,
      stateTree: PropTypes.object.isRequired,
      appearance: PropTypes.object.isRequired,
      background: PropTypes.object.isRequired,
      components: PropTypes.object,
      onChange: PropTypes.func,
      getRenderScopes: PropTypes.func,
    }
    static childContextTypes = {
      // 告知子组件,当前的组件层级,被绑定到了哪个数据上
      getStatePath: PropTypes.func,
    }
    constructor(props, context) {
      super()
      const { bind, scopeIndex, intercepters = {}, getInitialState = () => ({}) } = props
      const { getScopes = () => [] } = context
      const scopes = getScopes()
      if (scopeIndex !== undefined && scopeIndex !== -1 && scopes[scopeIndex] === undefined) {
        throw new ErrorWrongScopeIndex(scopes.length, scopeIndex)
      }

      this.componentId = createComponentId()
      this.instance = initialize()
      this.state = { stateChange: 0 }

      // CAUTION 生成的 bind 里面不能包含 [] 符号，因为会被 exist.js 误判为路径
      // bind 为空的情况, 自动生成一个
      this.bind = isNegative(bind) ? `${displayName}(${this.componentId})` : bind

      this.setupLifeCycle()
      this.setupIntercepters(intercepters)
      this.setupDefaultListeners(defaultListeners)
      this.registerToContext(props, context, getInitialState)
    }
    registerToContext(props, context, getInitialState) {
      const statePath = this.getResolvedStatePath(context, props)
      const { stateTree, appearance, background } = context
      const finalGetInitialState = () => ({ ...getDefaultState(), ...getInitialState() })
      // TODO pathGetter 中的 statePath 相关的应该由 stateTree 自己实现，另一部分算作外界附加上去的信息，两者要区分。
      const pathGetter = {
        getStatePath: partial(this.getResolvedStatePath, context, props),
        getRootStatePath: partial(this.getResolvedRootPath, context, props),
        getScopes: context.getScopes,
        getRenderScopes: context.getRenderScopes,
      }
      const { stateId, cancel: cancelStateTree } = stateTree.register(statePath, finalGetInitialState, displayName, pathGetter)
      this.stateId = stateId
      this.unRegisterStateTree = cancelStateTree
      this.unsubscribeStateTree = stateTree.subscribeByStateId(stateId, partial(this.subscribe, CHANGE_STATETREE))
      const { cancel: unsubscribeAppearance, hijack } = appearance.register(this.stateId, props, partial(this.subscribe, CHANGE_APPEARANCE))
      this.unsubscribeAppearance = unsubscribeAppearance
      this.hijack = hijack

      // 重新注册到 background
      // CAUTION 把 cancel 和 hijack 放在register 的返回值里可以一定程度上提高性能，因为path不变就不要重新生成函数
      const { cancel, inject: injectComponentArgs } = background.register(this.stateId, { ...props, ...pathGetter }, DeclarativeComponent)
      this.cancelBackground = cancel
      this.inject = injectComponentArgs
    }
    setupLifeCycle() {
      // 绑定声明周期函数
      each(primitiveFns, (fn, key) => {
        // CAUTION 要处理和当前 wrapper 的 lifecycle 冲突
        const injectedComponentFn = inject(fn, seal(this.getRenderArg))
        this[key] = this[key] !== undefined ? concat([injectedComponentFn, this[key].bind(this)]) : injectedComponentFn
      })
    }
    setupIntercepters(intercepters) {
      // 绑定 intercepter
      /* eslint-disable no-nested-ternary */
      this.intercepters = filter(mapValues(defaultIntercepters, (defaultIntercepter, name) => {
        return intercepters[name] !== undefined ?
          inject(intercepters[name], this.getInjectArg) :
          (defaultIntercepter === undefined ? undefined : inject(defaultIntercepter, this.getRenderArg))
      }), i => i !== undefined)
    }
    setupDefaultListeners(listeners) {
      this.listeners = mapValues(listeners, (defaultListener, name) => (...runtimeArgs) => {
        const statePath = this.getResolvedStatePath()
        const nextState = defaultListener(this.getRenderArg(statePath), ...runtimeArgs)
        if (nextState !== undefined) {
          this.context.stateTree.merge(this.getResolvedStatePath(), nextState, {
            type: REASON_DEFAULT_LISTENER,
            source: name,
          })
        }
      })
    }
    getInjectArg = () => {
      // CAUTION 一定要在运行时再拿path，因为 path 可能会变
      const currentStatePath = this.getResolvedStatePath()
      const stateTree = this.context.stateTree
      const appearance = this.context.appearance
      return {
        state: stateTree.get(currentStatePath),
        statePath: new StatePath(currentStatePath),
        rootStatePath: new StatePath(this.getResolvedRootPath()),
        stateTree,
        appearance,
        ...this.context.background.instances,
      }
    }
    getRenderArg = (statePath) => {
      // 接受 statePath 为参数用来节约性能
      return {
        state: this.context.stateTree.get(statePath || this.getResolvedStatePath()),
        props: this.props.props,
        children: this.props.children,
        listeners: this.listeners,
        intercepters: this.intercepters,
        context: this.context,
        instance: this.instance,
      }
    }
    getChildContext() {
      return {
        getStatePath: this.getResolvedStatePath,
      }
    }

    getResolvedStatePath = (reactContext = this.context, props = this.props) => {
      const { getScopes = () => [] } = reactContext || {}
      return resolveStatePath(getScopes(), this.bind, props.scopeIndex)
    }

    getResolvedRootPath = () => {
      const { getScopes = () => [] } = this.context || {}
      return resolveStatePath(getScopes(), '', this.props.scopeIndex)
    }

    subscribe = (type, changes) => {
      // CAUTION 在这里判断是因为未来 React 的 shouldComponentUpdate 会失效
      if (shouldComponentUpdate === undefined || shouldComponentUpdate(this.getRenderArg(), type, changes) !== false) {
        // CAUTION 不要把 version 记录到 state 上，我们要确保的是 render，所以记到 render 上
        this.setState({ stateChange: this.state.stateChange++ })
      }
      // 新增的声明周期函数
      if (type === CHANGE_STATETREE && typeof componentWillReceiveState === 'function') {
        componentWillReceiveState(this.getRenderArg(), changes)
      }
    }

    shouldComponentUpdate(nextProps, nextState) {
      // CAUTION 这里表示不接受父组件render，只订阅数据源的改变。之后 React 版本中这个会失效，必须从父组件控制
      return this.state.stateChange !== nextState.stateChange
    }

    componentDidMount() {
      if (typeof this.props.didMount === 'function') {
        inject(this.props.didMount, this.getInjectArg)()
      }
    }

    componentWillReceiveProps(nextProps) {
      // 不接受 config 动态变化
      /* eslint-disable no-console */
      if (!shallowEqual(this.props, nextProps)) {
        console.warn(`connected component should never received new props, statePath: ${this.getResolvedStatePath()}`, this.props, nextProps)
      }
      /* eslint-enable no-console */
    }

    componentWillUnmount() {
      if (typeof this.unRegisterStateTree === 'function') { this.unRegisterStateTree() }
      if (typeof this.unsubscribeStateTree === 'function') { this.unsubscribeStateTree() }
      if (typeof this.unsubscribeAppearance === 'function') { this.unsubscribeAppearance() }
      if (typeof this.cancelBackground === 'function') { this.cancelBackground() }
    }

    convertToControlledListener(injectedComponentArg) {
      const listeners = mapValues(injectedComponentArg.listeners, (changeFn, name) =>
        (...runtimeArgs) =>
          this.context.onChange(
            changeFn,
            name,
            this.props.path,
            ...runtimeArgs,
          ),
      )

      return {
        ...injectedComponentArg,
        listeners,
      }
    }

    render() {
      // 计算 statePath 的 scope
      // CAUTION 注意这里仍然是用 statePath 去取数据
      const componentArg = this.getRenderArg(this.getResolvedStatePath())
      // 在 dev 环境下校验 stateId 与上次是否相同
      if (this.stateId !== componentArg.state._id) {
        throw new Error(`component stateId changed, this may cause serious bug. bind: ${this.bind}, statePath: ${this.getResolvedStatePath()}`)
      }

      const injectedComponentArg = this.inject(componentArg)
      const finalComponentArg = (typeof this.context.onChange === 'function') ?
        this.convertToControlledListener(injectedComponentArg) :
        injectedComponentArg

      return this.hijack(render, display, this.props)(finalComponentArg)
    }
  }

  // CAUTION 遵循 lego 规范标记一下, 否则 identifier 会找不到
  Wrapper.__base = DeclarativeComponent

  Object.assign(Wrapper, mapValues(identifiers, createIdentifierComponent))
  return Wrapper
}
