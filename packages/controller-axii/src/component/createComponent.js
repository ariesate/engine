import VNode from '@ariesate/are/VNode'
import { invariant, mapValues } from '../util'
import { isRef } from '../reactive'
import vnodeComputed from '../vnodeComputed'
import {
  createDefaultMatch,
  createFragmentsContainerFactory,
  createNamedChildrenSlotProxy,
  replaceSlot,
  walkVnodes,
  FragmentDynamic,
  hasComputedAttr, createCallback
} from './utils'
import { isComponentVnode } from '../createAxiiController';

/**
 * Base & Feature 用法：
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

/**
 * 动态节点的写法, 在 Base render 或者 feature mutation 函数中
 * fragments[fragmentName](() => {
 *   return vnode
 * }, { arguments })
 *
 * fragments 可以被 Feature 劫持，用名字就行
 * mutate(fragmentName, (result, argv) => {
 *   // 直接操作 result
 * })
 */

/**
 * methods 用法:
 * Base.methods = {
 *   methodName: function(props, ...argv) {}
 * }
 * function 第一个参数是自动注入的 props。TODO 还要增加 derivedState？？state。
 */

/**
 * Style 用法:
 * Style = function(fragments) {
 *  通过 fragments 来确定作用域。
 *  fragments[fragmentName].elements[elementName] = {
 *    attrName: attrValue
 *  }
 *
 * attrValue 可以是函数或者具体的值。如果是函数可以获取到当前 fragments, 和上层 fragments 上所有的参数。
 * 例子：
 * // 使用参数
 * Style = (fragments) => {
 *  fragments[fragmentName].elements.element1 = {
 *    color: function(props, argv) {
 *    }
 *  }
 *
 *  定义参数
 *  fragments[fragmentName].argv.active = function() {
 *    const argv = ref(false) // 返回一个 reactive
 *    fragments[fragmentName].elements[elementName].attributes.onClick = () => {
 *      argv.value = xxx
 *    }
 *   return argv
 *  }
 *
 * CAUTION 注意，不管怎么写，都是通过一个函数来在 computed 中建立数据跟数据之间的关系。
 */

/**
 * Layout 用法:
 * 类似于 Style，但是在组件内部是写在 render 函数里的。
 * 这里暴露 Layout 是让外部有机会通过替换 Layout 来动态修改部分值。
 *
 */

/**
 * delegator 用法:
 * 当要用到第三方组件的时候，应该用 delegator 的方式，这样就能在运行时动态去替换掉局部了
 * base.delegator = {
 *   pagination: Pagination
 * }
 *
 */

export const ROOT_FRAGMENT_NAME = 'root'

export default function createComponent(Base, featureDefs=[]) {

  const fragmentsContainerFactory = createFragmentsContainerFactory()
  // 把 base 也伪装陈给一个 Feature， 参与收集
  const baseAsFeature = function() {}
  baseAsFeature.match = () => true
  baseAsFeature.Style = Base.Style
  baseAsFeature.Layout = Base.Layout
  baseAsFeature.methods = Base.methods
  baseAsFeature.propsTypes = Base.propsTypes

  /**
   * 开始通过 注入的参数 utils.fragments 收集 feature 中的元素
   * 1. 执行 Feature，通过通过 fragments.xxx.mutations = 收集 mutation
   * 2. 执行 Style/Layout，通过 fragments.xxx.elements[elementName] = {} 收集 style
   * 3. 执行 Style/Layout，通过 fragments.xxx.argv[argvName] = reactive 收集参数
   * 3. 执行 Style/Layout，通过 fragments.xxx.elements[elementName].onXXX = function() {} 收集回调事件
   *
   * 需要合并的:
   * 1. 通过 Feature.methods 注入回调。
   * 2. 通过 Feature.propTypes 合并 propType, 并用 Feature.match 来验证是否启用 feature。
   */
  const FeaturesWithBase = [baseAsFeature].concat(featureDefs)
  FeaturesWithBase.forEach(Feature => {
    const currentContainer = fragmentsContainerFactory.derive(Feature)

    // 1. 收集 mutations
    Feature(currentContainer)

    // 收集 style & Layout 和注册的参数(参数中的)
    // TODO 还有收集注册的回调！！！
    if (Feature.Style) {
      Feature.Style(currentContainer)
    }

    if (Feature.Layout) {
      Feature.Layout(currentContainer)
    }
  })


  function Component(props, context) {
    // CAUTION，在收集过程中要用到 props，所以写在 Component 函数里。
    // props 要合并 methods，还要根据 useXXXSlot 修改 children
    const processedProps = { ...props }
    let processedChildren = props.children
    if (Base.useNamedChildrenSlot) {
      processedChildren = createNamedChildrenSlotProxy(props.children[0])
    } else if (Base.useNamedChildrenSlot) {
      processedChildren = props.children[0]
    }
    processedProps.children = processedChildren

    // 把 base 也当做一个 fragment。这样 replaceSlot 什么都可以一次性处理。base 不需要生成 computed
    const baseFragmentsContainer = fragmentsContainerFactory.derive(Base)
    const rootFragment = baseFragmentsContainer[ROOT_FRAGMENT_NAME](() => {
      return Base(processedProps, context, baseFragmentsContainer) //注意，base 的参数是和 Feature 的参数不同
    }, {}, true) // 最后一个参数表示不需要生成 computed

    const activeFeatures = FeaturesWithBase.filter(Feature => {
      const match = Feature.match || createDefaultMatch(Feature.propTypes)
      return match(props)
    }).concat(Base) // 注意这里要 concat Base

    // 这里得到的 activeFragmentsContainer 就是所有 active feature 合并后的了
    const activeFragmentsContainers = fragmentsContainerFactory.filter((Feature) => {
      console.log(Feature)
      return activeFeatures.includes(Feature)
    })

    // 合并 method
    activeFeatures.forEach(Feature => {
      const match = Feature.match || createDefaultMatch(Feature.propTypes)
      if (!match(props)) return

      if (Feature.methods) {
        Object.entries(Feature.methods).forEach(([methodName, methodFn]) => {
          processedProps[methodName] = createCallback(props, methodFn, methodName)
        })
      }
    })

    return renderFragments(rootFragment, processedProps, context, activeFragmentsContainers, {}, Base.useNamedChildrenSlot)
  }

  // 合并 features propTypes。
  Component.propTypes = Object.assign({}, Base.propTypes, ...featureDefs.map(f => f.propTypes || {}))

  return Component
}


export const GLOBAL_NAME = 'global'

/**
 * fragment 的刷新时机：
 * 目前的 fragment 是由用户调用 dynamic 函数创建出来，除非用户在参数中指定不用刷新，否则会直接使用 vnodeComputed 来创建。
 * 因此刷新时机就是在 render 中依赖的对象的刷新时机。TODO Style 中新建的 reactive 变化会引起当前的变化？computed 的变化？理论上不应该，新建的都不应该引起当前变化！
 *
 */
function renderFragments(fragment, props, context, fragmentsContainers, upperArgv, useNamedChildrenSlot) {
  /**
   * 整个流程是后续遍历。做四件事。
   * 0。 渲染当前节点
   * 1. 渲染子节点
   * 2. 执行 Style
   * 3. 替换 slot
   *
   * fragment 里面的参数是从 upperArgv 里面读的。
   */
  // TODO fragment 重新 render 的时候，要回收 index 上次注册的 vnode.
  function renderProcess() {
    // 0. render
    const renderResult = fragment.render()
    const renderResultToWalk = Array.isArray(renderResult) ? renderResult : [renderResult]

    // 1. 渲染子节点 CAUTION 注意是先 render 完子节点，再处理自己。
    walkVnodes(renderResultToWalk, (walkChildren, originVnode, vnodes) => {
      if (originVnode instanceof FragmentDynamic) {
        // 建立 vnodeComputed，替换掉外面的引用。Fragment 本质上就是个 computed。
        const combinedArgv = Object.assign({}, upperArgv, originVnode.argv)

        vnodes[vnodes.indexOf(originVnode)] = renderFragments(originVnode, props, context, fragmentsContainers, combinedArgv, useNamedChildrenSlot)

      } else if ((originVnode instanceof VNode) && originVnode.children){
        invariant(Array.isArray(originVnode.children), 'something wrong, children is not a Array')
        walkChildren(originVnode.children)
      }
    })


    // 2. 开始执行 mutations，mutations 放在外面是因为可能读子 dynamic 里面的内容。
    fragmentsContainers.forEach(fragmentsContainer => {
      const mutations = fragmentsContainer[fragment.name].mutations()
      if (mutations) {
        // TODO 如果有返回值，就要替换原节点。 resultResult
        mutations.forEach((mutateFn) => mutateFn(renderResult, fragment.argv))
      }
    })

    // 3. 创建动态参数
    const dynamicArgv = {}
    fragmentsContainers.forEach(fragmentsContainer => {
      Object.assign(dynamicArgv, mapValues(fragmentsContainer[fragment.name].argv, (createArgv) => {
        return createArgv()
      }))
    })

    // 4. 计算 style && 5. TODO 要绑定事件
    walkVnodes(renderResultToWalk, (walkChildren, originVnode) => {
      if (!originVnode) return
      if (!originVnode instanceof VNode) return
      if (isComponentVnode(originVnode)) return
        // 因为 String 等对象可能没有 attributes
      if (originVnode.attributes) {

        const originStyle = originVnode.attributes.style || {}
        const isOriginStyleRef = isRef(originStyle)
        const matchedStyles = []
        const listenersByEventName = {}

        fragmentsContainers.forEach(fragmentsContainer => {
          // 收集样式
          matchedStyles.push(
            ...fragmentsContainer[GLOBAL_NAME].elements[originVnode.type].getStyle(),
            ...fragmentsContainer[fragment.name].elements[originVnode.type].getStyle()
          )

          // 收集 listeners
          Object.entries(fragmentsContainer[fragment.name].elements[originVnode.type].getListeners()).forEach(([eventName, listeners ]) => {
            if (!listenersByEventName[eventName]) listenersByEventName[eventName] = []
            listenersByEventName[eventName].push(...listeners)
          })
        })

        // 挂载 样式
        if (matchedStyles.length) {
          let shouldStyleBeReactive = isOriginStyleRef || hasComputedAttr(matchedStyles)

          const getNextStyle = () => {
            const partialStyle = Object.assign({}, ...matchedStyles.map(style => {
              return mapValues(style, (attrValue) => {
                return typeof attrValue === 'function' ? attrValue({...upperArgv, ...dynamicArgv}) : attrValue
              })
            }))
            return Object.assign({}, isOriginStyleRef ? originStyle.value : originStyle, partialStyle)
          }
          originVnode.attributes.style = shouldStyleBeReactive ? vnodeComputed(getNextStyle) : getNextStyle()
        }

        // 挂载监听事件
        if (Object.keys(listenersByEventName).length ){
          Object.entries(listenersByEventName).forEach(([eventName, listeners]) => {
            const originListener =  originVnode.attributes[eventName]
            originVnode.attributes[eventName] = (...argv) => {
              if (originListener) originListener(...argv)
              listeners.forEach(listener => {
                listener(props, {...upperArgv, ...dynamicArgv}, ...argv)
              })
            }
          })
        }
      }

      if (originVnode.children) {
        invariant(Array.isArray(originVnode.children), 'something wrong, children is not a Array')
        walkChildren(originVnode.children)
      }
    })

    // 6. 开始执行 replace slot。replaceSlot 内部必须保证不要再穿透 vnodeComputed。
    if (renderResult) {
      replaceSlot([renderResult], props.children) // 这里的 children 已经是处理过 slot 的了
    }

    return renderResult
  }

  return fragment.nonReactive ? renderProcess() : vnodeComputed(renderProcess)
}
