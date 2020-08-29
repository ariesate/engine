import VNode from '@ariesate/are/VNode'
import { invariant, mapValues } from '../util'
import { isRef } from '../reactive'
import vnodeComputed from '../vnodeComputed'
import {
  createDefaultMatch,
  createFeatureFunctionCollectors,
  createNamedChildrenSlotProxy,
  replaceSlot,
  walkVnodes,
  FragmentDynamic,
  chainMethod,
  makeCallbackName,
  compose,
  makeMethodName,
  tranform,
  hasComputedAttr, createCallback, zipObject
} from './utils'
import { isComponentVnode } from '../createAxiiController';
import { propTypes } from '../index';


function filterActiveFeatures(features, props) {
  return features.filter(Feature => {
    const match = Feature.match || createDefaultMatch(Feature.propTypes)
    return match(props)
  })
}

/**
 * createComponent 的用途:
 * 1. [Feature Based]将组件的代码按照 base + feature 的方式来拆分。能够更灵活地扩展 feature。
 * 2. [Method invoke callbacks]将组件里面修改数据的 method 单独声明出来，在使用时自动判断传入的 Props 有没有同名的，如果有自动调用。类似于自动实现外部回调。
 * 3. [Transparent listener]元素具名化之后，外部可以任意监听想监听的元素。
 * 4. [Slot]将组件的各个元素都取名，如果标上 slot，就能从外部传入参数。
 * 5. [Partial Rewrite]外部复写部分元素。
 *
 * 2-5 需求的本质是：
 * 作为通用组件，应该最大的化地方便使用者少写胶水代码。
 * Method invoke callbacks & 是 Transparent listener 是满足外部对逻辑控制的需求。
 * Slot & Partial Rewrite 是满足对样式控制的需求。
 * 这些都是运行时的动态控制。如果还不能满足，那么用户还可以把自己的需求写成业务 feature，通过 fragments 来劫持渲染过程。
 *
 **
 * CAUTION 关于 base 中动态变化要触发 feature 跟着变的问题。
 * 理论上 base 的任何变化上层的 feature 都应该重新进行匹配计算。因为这个匹配是动态的，不是建立静态关系。
 * feature 中的部分变化。是否有必要优化算法能根据动态变化的范围，来决定是否要重新匹配 feature ？。
 * 目前测试动态创建 10000 次 proxy 并读取属性耗时 3.24 毫秒。因此单个组件中重新计算匹配性能问题可以忽略。
 *
 * feature 的修改行为可以用 watch 来包装，如果完全没有触碰到 reactive data。那么确实可以不用再执行。
 *
 */

/**
 * Base + Feature 的用法:
 * 1. 将组件的"根据数据进行渲染"的部分包装到 fragments[fragmentName](Object scopeVariables)(Function createFragment) 中。
 * 2. 在 Feature 中使用 fragments[fragmentName].mutation = Function mutateFn 来修改 vnode。
 * 在 mutateFn 中会收到两个参数:
 *  - result: 前面产生的 vnode 结果。
 *  - localVars: fragment 计算所用到的变量。注意，Base 在声明的时候应该自己保证把所用到了的变量都传到了参数中。
 */

/**
 * Methods 用法:
 * Base.methods = {
 *   methodName: function(props, ...argv) {}
 * }
 * function 第一个参数是自动注入的 props。
 */

/**
 * Transparent listener 用法：
 * 在调用组件时传入 listeners，以 selector 作为路劲即可，以 fragments name 作为起止，例如：
 * <Com listeners = {
 *   (fragments) => ({
 *     fragments.root.element1.onClick = () => {}
 *   })
 * }
 * />
 */

/**
 * Slot 用法：在具名元素上标记 slot 即可。
 * <Com rewrite = {
 *   (fragments) => ({
 *     fragments.root.element1.element2 = () => {}
 *   })
 * }
 * />
 */

/**
 * Partial Rewrite 用法：
 * 在元素上传入 rewrite 对象即可，以 selector 作为路劲即可，以 fragments name 作为起止，例如：
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

/**
 * createComponent 的实现：
 * 1. 创建一个 fragmentsProxyContainer，通过 fragmentsProxyContainer.derive 为每个 feature 分配一个 fragmentsProxy，
 * 用来记录相应 feature 对 fragment 的改动。
 * 2. 创建合并后的 Component，Component.propType 是各个 feature 声明的合并。
 * 3. component 在 render 中动态执行 feature 的改动。
 *
 */
export default function createComponent(Base, featureDefs=[]) {
  // featureFunctionCollectors 是用来为每个 Feature 生产 fragmentsContainer 的,
  // fragmentsContainer 用来收集 相应 Feature 对 Fragment 的改动
  const featureFunctionCollectors = createFeatureFunctionCollectors()
  // 把 base 也伪装陈给一个 Feature， 参与收集
  const baseAsFeature = function() {}
  baseAsFeature.match = () => true
  baseAsFeature.Style = Base.Style
  baseAsFeature.methods = Base.methods
  baseAsFeature.propsTypes = Base.propsTypes

  /**
   * 开始通过 注入的参数 `fragments` 收集 feature 中的改动
   * 1. 执行 Feature，通过通过 fragments.xxx.mutations = 收集 mutation
   * 2. 执行 Style，通过 fragments.xxx.elements[elementName] = {} 收集 style
   * 3. 执行 Style，通过 fragments.xxx.argv[argvName] = reactive 收集参数
   * 4. 执行 Style，通过 fragments.xxx.elements[elementName].onXXX = function() {} 收集回调事件
   *
   * 需要合并的:
   * 1. 通过 Feature.methods 注入回调。
   * 2. 通过 Feature.propTypes 合并 propType, 并用 Feature.match 来验证是否启用 feature。
   */
  const FeaturesWithBase = [baseAsFeature].concat(featureDefs)
  FeaturesWithBase.forEach(Feature => {
    const featureFunctionCollector = featureFunctionCollectors.derive(Feature)

    // 1. 收集 mutations
    Feature(featureFunctionCollector)

    // 收集 style & Layout 和注册的参数(参数中的)
    // TODO 还有收集注册的回调！是否考虑把 Style 也变成 Feature，可以有自己独立的 methods。
    if (Feature.Style) {
      Feature.Style(featureFunctionCollector)
    }
  })


  function Component(props, context) {
    // 1. 先统一处理一下 props, 其中 children 要考虑 slot 的情况。
    const processedProps = { ...props }
    processedProps.children = props.children ? (Base.useNamedChildrenSlot ? createNamedChildrenSlotProxy(props.children[0]) : props.children[0]) : undefined

    // 2. 开始渲染 Base，注意，这里还没有 render 其中的 fragments。在后面 renderFragments 中 render。
    // 虽然把 base 也当做一个 fragment。但 render base 参数不同，base render 时要直接用到 props，没有必要强行统一。
    const baseFeatureFunctionCollector = featureFunctionCollectors.derive(Base)
    const rootFragment = baseFeatureFunctionCollector[ROOT_FRAGMENT_NAME](() => {
      return Base(processedProps, context, baseFeatureFunctionCollector) //注意，base 的参数是和 Feature 的参数不同
    }, {}, true) // 最后一个参数表示不需要生成 computed

    // 3. 不一定每个 feature 都要激活，一般会要根据是否传入了标志性的 props 来看，所以这里过滤一下。
    const activeFeatures = filterActiveFeatures(FeaturesWithBase, props)

    // 4. 相应的，得到激活的 feature 的 fragmentsProxy
    const activeFeatureFunctionCollectors = featureFunctionCollectors.filter((Feature) => {
      return activeFeatures.includes(Feature)
    })

    // 5. 把对 method 的调用全部转发到 on{Method} 上。我们在回调的 PropType 的 default 声明中来真实调用 method。
    // 这样就能利用 AXII 框架的能力实现运行时传入回调 通过 return false 等来控制组件的行为。
    const activeMethodNames = activeFeatures.reduce((last, Feature) => last.concat( Object.keys(Feature.methods || []) ), [])
    Object.assign(processedProps, zipObject(
      activeMethodNames,
      (callBackName) => props[makeCallbackName(callBackName)]
    ))

    return renderFragments(rootFragment, processedProps, context, activeFeatureFunctionCollectors, props, Base.useNamedChildrenSlot)
  }


  // 合并 features propTypes。为每一个 method 生成名为 on{Method} 的回调 propType
  const methodCallbacks = FeaturesWithBase.reduce((result, Feature) => {
    const names = Object.keys(Feature.methods || {}).map(makeCallbackName)
    return {
      ...result,
      // TODO 未来这里的参数还可能会修改，这取决于 AXII 是如何给回到传值的，目前只默认传了 props。
      ...zipObject(names, (callbackName) => propTypes.callback.default(() => (props, ...restArgv) => {
        // 反向查找 method name
        const methodName = makeMethodName(callbackName)
        // 在执行默认 callback 的时候动态判断哪些 feature method 是需要
        const activeFeatures = filterActiveFeatures(FeaturesWithBase, restArgv)

        const methods = activeFeatures.reduce(( last, Feature) => last.concat(Feature.methods[methodName] || []), [])
        // compose 一下，这样后面 Feature 的 method 可以决定要不要覆盖、复用前面同名的 method.
        // method 不需要任何默认参数，这是和 onXXX 回调不同的地方。
        compose(methods)(...restArgv)
      }))
    }
  }, {})


  Component.propTypes = Object.assign({},
    Base.propTypes,
    ...featureDefs.map(f => f.propTypes || {}),
    methodCallbacks
  )

  return Component
}


export const GLOBAL_NAME = 'global'

/**
 * renderFragments 的实现
 * 1. 在 Base render 的时候，fragments 并没有被 render，只是作为一个 vnode 节点放在了结果里面，这里才开始 render。
 * 2. 我们将 fragment 的基本 render 和 feature 中的 mutation 合并到一个函数里，使用 vnodeComputed 来包裹，
 * 这样不管是来自自己的变化，还是外部刷新，所有过程都会自动执行，包括 mutation。
 *
 * fragment 的刷新时机：
 * 目前的 fragment 是由用户调用 dynamic 函数创建出来，除非用户在参数中指定不用刷新，否则会直接使用 vnodeComputed 来创建。
 * 因此刷新时机就是在 render 中依赖的对象的刷新时机。TODO Style 中新建的 reactive 变化会引起当前的变化？computed 的变化？理论上不应该，新建的都不应该引起当前变化！
 *
 */
function renderFragments(fragment, props, context, featureFunctionCollectors, upperArgv, useNamedChildrenSlot) {
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
    let renderResult = fragment.render()
    let renderResultToWalk = Array.isArray(renderResult) ? renderResult : [renderResult]

    // 1. 创建动态参数。这些参数是使用 fragments.argv[argvName] = () => xxx 定义的。可以看做是渲染时需要的局部变量。在 Style 里面可能用到。
    const dynamicArgv = {}
    featureFunctionCollectors.forEach(featureFunctionCollector => {
      Object.assign(dynamicArgv, mapValues(featureFunctionCollector[fragment.name].argv, (createArgv) => {
        return createArgv()
      }))
    })

    // 2. 在当前作用域下的参数合集，包括 上层的参数、当前 fragment 上定义的参数、动态创建的参数。这就是单签 fragment 下所有能用到的变量。
    const commonArgv = {...upperArgv, ...fragment.argv, ...dynamicArgv}

    // 2. 开始递归从自己 render 的结果里寻找还有没有 fragment，如果有进行 render.
    // CAUTION 虽然是先 render 完自己，但是后续操作（例如 mutation）是先处理完子几点再处理自己。
    walkVnodes(renderResultToWalk, (walkChildren, originVnode, vnodes) => {
      if (originVnode instanceof FragmentDynamic) {
        vnodes[vnodes.indexOf(originVnode)] = renderFragments(originVnode, props, context, featureFunctionCollectors, commonArgv, useNamedChildrenSlot)
      } else if ((originVnode instanceof VNode) && originVnode.children){
        // 这是个没必要的验证，先放在这里为了防止出问题不知道怎么回事。
        invariant(Array.isArray(originVnode.children), 'something wrong, children is not a Array')
        walkChildren(originVnode.children)
      }
    })

    // 3. 开始执行每个 feature 中的 mutations。
    featureFunctionCollectors.forEach(featureFunctionCollector => {
      const mutations = featureFunctionCollector[fragment.name].mutations()
      if (mutations) {
        // 如果有返回值，就要替换原节点。因为有时候 mutation 写起来没有直接写想要的结构来得方便。
        mutations.forEach((mutateFn) => {
          const alterResult = mutateFn(props, renderResult, commonArgv)
          if (alterResult) {
            renderResult = alterResult
            renderResultToWalk = Array.isArray(renderResult) ? renderResult : [renderResult]
          }
        })
      }
    })

    // 4. 收集 style 和 开始绑定事件
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

        featureFunctionCollectors.forEach(fragmentsProxy => {
          // 收集样式
          matchedStyles.push(
            ...fragmentsProxy[GLOBAL_NAME].elements[originVnode.type].getStyle(),
            ...fragmentsProxy[fragment.name].elements[originVnode.type].getStyle()
          )

          // 收集 listeners
          Object.entries(fragmentsProxy[fragment.name].elements[originVnode.type].getListeners()).forEach(([eventName, listeners ]) => {
            if (!listenersByEventName[eventName]) listenersByEventName[eventName] = []
            listenersByEventName[eventName].push(...listeners)
          })
        })

        // 挂载 样式
        // TODO 未来考虑将"静态的"样式生成 css rule 来防止元素上 style 爆炸。
        if (matchedStyles.length) {
          let shouldStyleBeReactive = isOriginStyleRef || matchedStyles.some(s => typeof s === 'function')
          const getNextStyle = () => {
            const partialStyle = Object.assign({}, ...matchedStyles.map(style => {
              return typeof style === 'function' ? style(commonArgv) : style
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
                listener(props, commonArgv, ...argv)
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

    // 5. 开始执行 replace slot。replaceSlot 内部必须保证不要再穿透 vnodeComputed。
    if (renderResult) {
      replaceSlot([renderResult], props.children, props, commonArgv) // 这里的 children 已经是处理过 slot 的了
    }

    return renderResult
  }

  // 当为了解约性能并且明确 fragment 不会变化的时候可以标记为 nonReactive。
  return fragment.nonReactive ? renderProcess() : vnodeComputed(renderProcess)
}
