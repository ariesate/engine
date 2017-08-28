import React from 'react'
import { partial, mapValues } from './util'
import { createOneToManyContainer } from './common'
import createSubscribers from './createSubscribers'
import { DISPLAY_BLOCK } from './constant'

export default function createAppearance(stateTree, externalProps = {}) {
  const appearance = {}
  const subscribers = {}
  const globalSubscribers = createSubscribers()
  const stateIdByComponentPath = createOneToManyContainer()

  function injectExternalListenerArg(id, listener, props) {
    return (...runtimeArgs) => {
      const state = stateTree.getById(id)
      return listener({
        // primitive 的组件没有 state， 例如 div。所以这里要判断下
        statePath: state ? state._getStatePath() : undefined,
        componentPath: appearance[id].componentPath,
        ...props,
      }, ...runtimeArgs)
    }
  }

  function hijack(id, render, display, props = {}) {
    return function appearanceRender(componentArg = {}) {
      const style = appearance[id].style

      if (!appearance[id].visible) {
        style.display = 'none'
      } else if (display === DISPLAY_BLOCK) {
        delete style.display
        // style.display = 'block'
      } else {
        style.display = 'inline-block'
      }

      if (appearance[id].children !== undefined) {
        componentArg.children = appearance[id].children
      }

      const injectedExternalProps = mapValues(externalProps, (prop) => {
        if (typeof prop !== 'function') return prop

        return injectExternalListenerArg(id, prop, props)
      })

      return (
        <div style={{ ...style }} {...injectedExternalProps} >
          {render(componentArg)}
        </div>
      )
    }
  }

  // CAUTION 支持参数重载的形式，因为 background 收集变化的方式不一样
  function subscribeById(id, fn) {
    if (subscribers[id] === undefined) {
      subscribers[id] = createSubscribers()
    }
    return subscribers[id].insert(fn)
  }

  function subscribe(fn) {
    return globalSubscribers.insert(fn)
  }

  function notify(id) {
    if (subscribers[id] !== undefined) {
      subscribers[id].notify()
      globalSubscribers.notify({
        change: [id],
      })
    }
  }

  return {
    register(id, { path: componentPath }, fn) {
      const unsubscribe = subscribeById(id, fn)
      const componentPathKey = (componentPath !== undefined) ? componentPath.join('.') : undefined
      appearance[id] = { visible: true, style: {}, componentPath }
      // CAUTION 在与 react-router 这样的库结合使用时，由于会动态创建组件，
      // 所以  Render 无法给组件打上 path, 要兼容这种情况。
      if (componentPathKey !== undefined) {
        stateIdByComponentPath.insert(componentPathKey, id)
      }

      return {
        cancel() {
          unsubscribe()
          delete appearance[id]
          if (componentPathKey !== undefined) {
            stateIdByComponentPath.remove(componentPathKey, id)
          }
        },
        hijack: partial(hijack, id),
      }
    },
    isVisibleById(id) {
      return appearance[id].visible
    },
    setVisibleById(id, visible = false) {
      appearance[id].visible = visible
      notify(id)
    },
    replaceChildrenById(id, nextChildren) {
      appearance[id].children = nextChildren
      notify(id)
    },
    subscribe,
    subscribeById,
    mergeStyleById(id, styleToMerge) {
      appearance[id].style = { ...appearance[id].style, ...styleToMerge }
      notify(id)
    },
    getIdsByComponentPath: pathArr => stateIdByComponentPath.get(pathArr.join('.')),
  }
}
