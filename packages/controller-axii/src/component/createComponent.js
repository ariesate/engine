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
} from './utils'
import { isComponentVnode } from '../createAxiiController';
import { normalizeLeaf } from '../../../engine/createElement';

function filterActiveFeatures(features, props) {
  return features.filter(Feature => {
    const match = Feature.match || createDefaultMatch(Feature.propTypes)
    return match(props)
  })
}

/**
 * createComponent 的用途:
 * 1. [Feature Based]将组件的代码按照 base + feature 的方式来拆分。能够更灵活地扩展 feature。
 * 2. [Transparent listener]元素具名化之后，外部可以任意监听想监听的元素。
 * 3. [Slot]将组件的各个元素都取名，如果标上 slot，就能从外部传入参数。
 * 4. [Partial Rewrite]外部复写部分元素。
 *
 * 2-4 需求的本质是：
 * 作为通用组件，应该最大的化地方便使用者少写胶水代码。
 * Transparent listener 是满足外部对逻辑控制的需求。
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
 * 创建出来的 Component 与外界约定的 props：
 * listeners: () => {} transparent listener，可以以 匹配的方式监听任意元素的事件
 * overwrite: [Feature]，完全开发 Feature 的能力，可以动态加入。
 * CAUTION 其实 listeners 也可以用 overwrite 实现，只不过我们认为这是会常用的，所以放出来了。未来可能样式修改也会常见，也要放出来。
 *
 * CAUTION 关于组件里面又有 createComponent 要穿透传递的问题：
 * 目前可以在 overwrite 上面写 feature，feature 中使用 modify 来修改 component 的 attribute。
 * 如果要修改的 component 也是 createComponent 创建出来的，那么就可以继续传递 overwrite prop 来深层修改。
 */
export default function createComponent(Base, featureDefs=[]) {

  // 把 base 也伪装陈给一个 Feature， 参与收集
  const BaseAsFeature = function() {}
  BaseAsFeature.match = () => true
  BaseAsFeature.Style = Base.Style
  BaseAsFeature.methods = Base.methods
  BaseAsFeature.propTypes = Base.propTypes

  // 把 Feature 的 Style 也当成一个 Feature, 这样在 Style 上面也可以定义 methods/propTypes
  const FeaturesWithBase = [BaseAsFeature].concat(featureDefs).reduce((last, Feature) => last.concat(
    Feature,
    Feature.Style || []
  ), [])

  function Component({ children, listeners, overwrite = [], ...restProps }, context) {
    // 1. 先统一处理一下 props, 其中 children 要考虑 slot 的情况。
    const processedProps = { ...restProps }
    processedProps.children = children ? (Base.useNamedChildrenSlot ? createNamedChildrenSlotProxy(children[0]) : children) : undefined

    // featureFunctionCollectors 是用来为每个 Feature 生产 fragmentsContainer 的,
    // fragmentsContainer 用来收集 相应 Feature 对 Fragment 的改动
    const featureFunctionCollectors = createFeatureFunctionCollectors()
    // 2. 开始执行所有 active 的 feature，可以用 Feature 函数的作用域为 feature 自身创建一些临时数据。
    // 注意，如果有 transparent listeners, 把 它也当成一个 feature.
    const activeFeatures = filterActiveFeatures(FeaturesWithBase, restProps).concat(listeners || [], overwrite)
    activeFeatures.forEach(Feature => {
      const featureFunctionCollector = featureFunctionCollectors.derive(Feature)
      // 进行 mutations/style/listener 收集。
      // 注意我们的 BaseAsFeature 是伪造的，不会发生任何收集。
      Feature(featureFunctionCollector)
    })

    // 3. 开始创建 root fragment，本质上是把 Base 执行一下。这里还是用 BaseAsFeature 上的 FeatureFunctionCollector 去创建里面的 fragments.
    const baseFeatureFunctionCollector = featureFunctionCollectors.derive(BaseAsFeature)
    const rootFragment = baseFeatureFunctionCollector[ROOT_FRAGMENT_NAME]({})(() => {
      return Base(processedProps, context, baseFeatureFunctionCollector)
    })

    // 4. 只要激活的 feature 的 FeatureFunctionCollector，减少后面遍历的过程
    const activeFeatureFunctionCollectors = featureFunctionCollectors.filter((Feature) => {
      return activeFeatures.includes(Feature)
    })

    // 5. 开始递归渲染 fragment 了。
    return renderFragments(rootFragment, processedProps, context, activeFeatureFunctionCollectors, restProps, Base.useNamedChildrenSlot)
  }

  // 6. TODO 作为 Feature，会需要去修改、抑制 Base 或者其他 Feature 的默认 callback 行为吗？
  // 我们目前没有处理，如果有需求，目前 Feature 声明 propTypes 时会覆盖前面，自己也可以做。
  Component.propTypes = Object.assign({},
    ...FeaturesWithBase.map(f => f.propTypes || {}),
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
 * 因此刷新时机就是在 render 中依赖的对象的刷新时机。
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
  function renderProcess() {
    // 1. render
    let renderResult = fragment.render()
    let renderResultToWalk = Array.isArray(renderResult) ? renderResult : [renderResult]

    // 2. 在当前作用域下的参数合集，包括 上层的参数、当前 fragment 上定义的参数。这就是当前 fragment 下所有能用到的变量。
    const commonArgv = {...upperArgv, ...fragment.localVars}

    // 在渲染子 component 之前，我们可以先有个 prepare 函数，这对要提前进行一些变量计算非常有用。
    featureFunctionCollectors.forEach(featureFunctionCollector => {
      const preparations = featureFunctionCollector[fragment.name].getPreparations()
      if (preparations) {
        preparations.forEach((prepare) => {
          const dynamicVars = prepare(commonArgv)
          if (dynamicVars) {
            // 不允许动态覆盖参数，容易出问题，职能用修改 vnode 结果的方式来改。
            invariant(Object.keys(dynamicVars).every(key => !(key in commonArgv)), `do not overwrite var in prepare function ${Object.keys(dynamicVars)}`)
            Object.assign(commonArgv, dynamicVars)
          }
        })
      }
    })

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
      const modifications = featureFunctionCollector[fragment.name].getModifications()
      if (modifications) {
        // 如果有返回值，就要替换原节点。因为有时候 modification 写起来没有直接写想要的结构来得方便。
        modifications.forEach((modify) => {
          const alterResult = modify(renderResult, commonArgv)
          if (alterResult) {
            renderResult = alterResult
            renderResultToWalk = Array.isArray(renderResult) ? renderResult : [renderResult]
          }
        })
      }
    })

    // 4. 收集 style 和 开始绑定事件
    // TODO 这里可以改善一下性能，先取出所有有定义的 elements，再在遍历中去匹配，而不是每个节点都试探去取一次。
    walkVnodes(renderResultToWalk, (walkChildren, originVnode) => {
      if (!originVnode) return
      if (!originVnode instanceof VNode) return
      // TODO component vnode 应该也要处理
      if (isComponentVnode(originVnode)) return
      if (typeof originVnode.type !== 'string') return

      // 普通节点
      const originStyle = originVnode.attributes.style || {}
      const isOriginStyleRef = isRef(originStyle)
      const matchedStyles = []
      const listenersByEventName = {}

      featureFunctionCollectors.forEach(collector => {
        // 收集样式
        matchedStyles.push(
          ...collector[GLOBAL_NAME].elements[originVnode.type].getStyle(),
          ...collector[fragment.name].elements[originVnode.type].getStyle()
        )

        // 收集 listeners
        Object.entries(collector[fragment.name].elements[originVnode.type].getListeners()).forEach(([eventName, listeners ]) => {
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
              // 注意补足当前作用域下所有可用的 variable 作为参数。
              listener(...argv, commonArgv)
            })
          }
        })
      }

      // 5. 开始执行 replace slot。replaceSlot 内部必须保证不要再穿透 vnodeComputed。
      // CAUTION slot children 并没有区分 fragments.
      if(useNamedChildrenSlot && originVnode.attributes.slot && props.children[originVnode.type]) {
        const slotChild = props.children[originVnode.type]
        originVnode.children = [normalizeLeaf((typeof slotChild === 'function') ? slotChild(commonArgv) : slotChild)]
      }

      if (originVnode.children) {
        invariant(Array.isArray(originVnode.children), 'something wrong, children is not a Array')
        walkChildren(originVnode.children)
      }
    })

    return renderResult
  }

  // 当为了解约性能并且明确 fragment 不会变化的时候可以标记为 nonReactive。
  return fragment.nonReactive ? renderProcess() : vnodeComputed(renderProcess)
}
