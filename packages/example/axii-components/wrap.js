import {
  normalizeLeaf,
  createChildrenProxy,
  Fragment
} from 'axii'
/**
 * Base 是建立数据(props/state) 和视图之间的关系，是一个一次性的过程。没有任何局部变量
 * Feature 也是同样的，没有任何局部变量。所以任何时候执行都可以。
 *
 * CAUTION 关于 base 中动态变化要触发 feature 跟着变的问题。
 * 理论上 base 的任何变化上层的 feature 都应该重新进行匹配计算。因为这个匹配是动态的，不是建立静态关系。
 * feature 中的部分变化。是否有必要优化算法能根据动态变化的范围，来决定是否要重新匹配 feature ？。
 * 目前测试动态创建 10000 次 proxy 并读取属性耗时 3.24 毫秒。因此单个组件中重新计算匹配性能问题可以忽略。
 *
 * feature 的修改行为可以用 watch 来包装，如果完全没有触碰到 reactive data。那么确实可以不用再执行。
 *
 */
class Dynamic {
  constructor(name, render, argv) {
    this.name = name
    this.render = render
    this.argv = argv
  }
}
export function dynamic(name, render, ...argv) {
  return new Dynamic(name, render, argv)
}

export default function wrap(Base, featureDefs) {
  const mutationsByDynamicName = new Map()

  function Component(props) {

    const indexContainer = {}

    featureDefs.forEach(Feature => {
      const match = Feature.match || createDefaultMatch(Feature.propTypes)
      if (!match(props)) return

      Feature(props, (dynamicName, mutateFn, prepareFn) => {
        let mutations = mutationsByDynamicName.get(dynamicName)
        if (!mutations ) mutationsByDynamicName.set(dynamicName, (mutations = []))
        mutations.push([mutateFn, prepareFn])
      }, indexContainer)
    })

    const result = Base(props, {}, indexContainer)

    runDynamic(result, mutationsByDynamicName)

    let final = result
    featureDefs.forEach(Feature => {
      if (Feature.Render) {
        const alterFinal = Feature.Render(props, final, result, indexContainer)
        if (alterFinal) final = alterFinal
      }
    })

    return final
  }

  // 合并 features propTypes。
  Component.propTypes = Object.assign({}, Base.propTypes, ...featureDefs.map(f => f.propTypes || {}))

  Component.Style = (...argv) => {
    if (Base.Style) Base.Style(...argv)
    featureDefs.forEach(Feature => {
      if (Feature.Style) {
        Feature.Style(...argv)
      }
    })
  }

  return Component
}

function runDynamic(result, mutationsByDynamicName) {
  walkVnodes([result], (vnode) => {
    if (vnode instanceof Dynamic) {
      const mutations = mutationsByDynamicName.get(vnode.name)
      if (mutations) {
        mutations.forEach(([mutateFn, prepareFn]) => {
          if (prepareFn) prepareFn(vnode)
        })
      }
      return vnode.render()
    }
  }, (renderResult, originVnode) => {
    if (originVnode instanceof Dynamic) {
      const mutations = mutationsByDynamicName.get(originVnode.name)
      if (mutations) {
        mutations.forEach(([mutateFn]) => mutateFn(renderResult, ...originVnode.argv))
      }
      return normalizeLeaf(renderResult)
    }
  })
}

function walkVnodes(vnodes, render, handle) {
  vnodes.forEach((vnode) => {

    const next = render(vnode, vnodes)

    if (next) {
      walkVnodes(next, render, handle)
    } else if (next === false){
      // stop
    } else if (vnode.children){
      walkVnodes(vnode.children, render, handle)
    }

    const toReplace = handle(next, vnode)
    if (toReplace) {
      vnodes[vnodes.indexOf(vnode)] = toReplace
    }
  })
}

function createDefaultMatch(featurePropsTypes) {
  return (props) => {
    if (!featurePropsTypes || Object.keys(featurePropsTypes).length === 0) return true
    return Object.keys(featurePropsTypes).some(k => props[k] !== undefined)
  }
}

export function flatChildren(children) {
  return createChildrenProxy(children)
}

export function packChildren(name, children) {
  children.name = name
  return children
}


class IndexContainer {
  ensureCollection(name) {
    // TODO 可能要做个 invariant 防止两个 feature 声明了同一个名字
    if (!this[name]) this[name] = new Set()
    return this[name]
  }
}
