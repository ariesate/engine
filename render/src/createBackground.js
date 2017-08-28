/**
 * background 是提供给用户的来简化 stateTree 操作的机制。例如 validation，future 等。
 * 注册到 background 中的数据结构有两种：
 * 1. utility。会注入到用户的 listener 函数中，为用户提供某些快捷操作，例如 validation。
 * 2. job。visible，mapBackgroundToState 这种需要根据依赖自动运行的函数。
 *
 * 以 validation utility 为例，background 为它提供了三个能力：
 * 1. 有独立的数据结构和实例。例如 validation 内部可以自己保存每个组件的验证函数和验证结果。
 * 2. 劫持最后传到组件内的参数。例如 validation 需要劫持 listener 来插入触发验证的函数。
 * 3. 直接操作 stateTree 或者 appearance。这个能力通常用来为用户提供某些快捷操作，例如 validation reset。
 *
 * createBackground 代码中做了三个重要的事情：
 * 1. 对外提供统一的 register 函数，这个函数是 connect 中对每个组件自动调用的。
 * 在 register 函数中，再调用相关的 background 的 register。这样就建立了组件与 background 的链接。
 * 在 validation 例子中，就是把用户在组件上填写的 validator register 到 validation 这个 background 中去。
 *
 * 2. 将所有 background 的 cancel register，inject 等收集起来，也是供 createConnect 中调用。
 *
 * 3. 在任何 background 发生变化时，调用用户写的 mapBackgroundToProps，更新 stateTree。
 *
 * utility 必须export check 和 initialize 方法。check 方法表示当前这个background 要不要在connect 时
 * 做点什么。initialize 可以返回一下几个函数，这及个函数会在check 执行为 true 时被 container 调用：
 *
 * 1. register。会在组件 render 时注册。
 * 2. inject。在组件渲染时调用，让 background 有机会劫持最后传给组件的数据。例如 validation 需要劫持 listener
 * 3. collect。如果当前 utility 需要依赖计算的支持，那么提供这个函数，详情见 createBackgroundJobContainer。
 * 4. extract。如果当前 utility 需要依赖计算的支持，那么提供这个函数，详情见 createBackgroundJobContainer。
 * 5.  once。如果当前 utility 需要依赖计算的支持，那么提供这个函数，详情见 createBackgroundJobContainer。
 */

import { map, concat, each, compose, partial, filter, noop } from './util'
import createBackgroundJobContainer from './createBackgroundJobContainer'

const keepInject = (_, __, arg) => arg
const looseInjectPartial = (fn, ...args) => (fn === undefined ? keepInject : partial(fn, ...args))
const composeOrderedFns = (fns) => {
  // TODO 目前仅支持 first, last 参数
  const orderedFns = []
  const lastFnsTmp = []
  fns.forEach((fn) => {
    if (fn.first === true) {
      orderedFns.unshift(fn.fn)
    } else if (fn.last === true) {
      lastFnsTmp.push(fn.fn)
    } else {
      orderedFns.push(fn.fn)
    }
  })

  return compose(orderedFns.concat(lastFnsTmp))
}


export default function createBackground(backgroundDef = {}, stateTree, appearance) {
  let version = 0

  const { jobs: jobsDefs = {}, utilities: utilityDefs = {} } = backgroundDef
  // CAUTION 这里的写法是为了把 instances 传给 background，因为有的 background 提供函数里面也要注入 utility
  const utilInstances = {}
  const jobs = createBackgroundJobContainer(jobsDefs, utilityDefs, utilInstances, stateTree, appearance)
  each(utilityDefs, ({ initialize }, name) => utilInstances[name] = initialize(stateTree, appearance, utilInstances))

  const registerComponent = (stateId, config, Component) => {
    // 注册到 utility 里面
    const filteredUtilities = filter(utilInstances, (_, name) => utilityDefs[name].check(config, Component))
    const combinedUtilityRegister = concat(map(filteredUtilities, utility => utility.register || noop))
    // 下面这一行是真正注册
    const cancelUtilities = concat(combinedUtilityRegister(stateId, config, Component))
    const combinedInject = composeOrderedFns(map(filteredUtilities, (utility) => {
      return typeof utility.inject === 'object' ?
        { ...utility.inject, fn: looseInjectPartial(utility.inject.fn, stateId, config) } :
        { fn: looseInjectPartial(utility.inject, stateId, config) }
    }))

    const cancelJobs = jobs.register(stateId, config, Component)
    const cancel = concat([cancelUtilities, cancelJobs])
    return { cancel, inject: combinedInject, cancelJobs }
  }

  each(utilInstances, (instance) => {
    if (instance.subscribe !== undefined) {
      instance.subscribe(() => { version += 1 })
    }
  })

  return {
    instances: utilInstances,
    register: registerComponent,
    onSteady() {
      // 开始订阅变化，激活所有。
      each(utilInstances, (util) => { if (util.start !== undefined) util.start() })
      jobs.start()
    },
    pause: jobs.pause,
    resume: jobs.resume,
    getVersion() {
      return version
    },
  }
}

