import { invariant, mapValues, createUniqueIdGenerator } from '../util'
import { isAtom, atomComputed } from '../reactive'
import vnodeComputed, {isVnodeComputed} from '../vnodeComputed'
import {
  createDefaultMatch,
  createActionCollectorContainer,
  createNamedChildrenSlotProxy,
  walkVnodes,
  FragmentDynamic,
  createStylesheet,
  normalizeStyleValue,
  isDynamicObject,
  computeDynamicObject, appendRule
} from './utils'
import { Fragment, normalizeLeaf, VNode, watch } from '../index';


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
 */

/**
 * Partial Rewrite 用法：
 * 在元素上传入 overwrite 对象即可，就像一个 Feature 一样可以使用 modify.
 */

/**
 * CAUTION 关于 feature 之间隐式依赖的问题
 * 例：Table 的 Expandable feature 需要在所有其他 feature 处理完 tr 之后，再在自己的 expand td 的 colspan 上写上正确的数字。
 * 1. 如何确保自己是最后处理的？如果还有动态添加的 feature 的话，可能还要保证自己是在动态 feature 之后，这对系统能力要求就更高了。
 * 2. 如果还有其他 feature 也要所有都完成以后的信息呢？
 * 这个问题从 AOP 的角度来思考应该是无解的，只能通过 live query 等来减轻。详见文档 drawbacksOfAOP。
 *
 * TODO 提供对 fragment 的 liveQuery 功能，正好 fragments 创建的就是一个 vnodeComputed。
 * 应该允许 Feature 拿到这个 vnodeComputed 引用，再在上面创建 vnodeComputed，实现 liveQuery。
 * 例如 Table 的 expandable 应该能拿到整个 head fragment，这样无论是什么情况，当其中的列变化时，expandable 都能收到。
 */
export const ROOT_FRAGMENT_NAME = 'root'

const generateComponentId = createUniqueIdGenerator()

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
 *
 * fragment 的实现：
 * 到底什么是 fragment？fragment 实际上是一个具有"本地变量"的片段。这个本地变量通常是由 vnodeComputed 里的 data.map
 * 等递归函数产生的的。
 * fragment 要确保每次自己被调用时，都会去把已经注册的 modify 等执行一遍。
 */
export default function createComponent(Base, featureDefs=[]) {

  // sideEffects，目前 css 会插入到 head 中
  const stylesheet = createStylesheet()
  const componentId = generateComponentId()
  const generateInstanceId = createUniqueIdGenerator(componentId)

  // 虽然 Base 不需要收集，但要享受 methods 等注入修改，所以把 base 也伪装陈给一个 Feature，
  const BaseAsFeature = function() {}
  BaseAsFeature.match = () => true
  BaseAsFeature.Style = Base.Style
  BaseAsFeature.methods = Base.methods
  BaseAsFeature.propTypes = Base.propTypes

  // 把 Feature 的 Style 也当成一个 Feature, 这样在 Style 上面也可以定义 methods/propTypes
  const FeaturesWithBase = [BaseAsFeature].concat(featureDefs).reduce((last, Feature) => {
    last.push(Feature)
    if (Feature.Style) {
      Feature.Style.displayName = `${Feature.name}Style`
      last.push(Feature.Style)
    }
    return last
  }, [])

  function Component({ children, listeners, overwrite = [], ref, ...restProps }, upperRef) {
    const instanceId = generateInstanceId()
    // 如果用户自己声明了 Base.forwardRef，就会收到第二参数，自己能处理 ref，否则系统自动将 ref 挂载到第一层级。
    const selfHandleRef = Base.forwardRef ? upperRef : undefined
    // 1. 先统一处理一下 props, 其中 children 要考虑 slot 的情况。
    const processedProps = { ...restProps }
    // TODO 目前的处理方式要改一下
    if (Base.forwardRef) processedProps.ref = ref
    processedProps.children = children ? (Base.useNamedChildrenSlot ? createNamedChildrenSlotProxy(children[0] || {}) : children) : undefined

    // 1. 找到所有 active 的feature，包括用户在 Props 上动态传进来的。
    // CAUTION Feature 为什么放到 render 函数里而不是外面执行? 因为这样可以用 Feature 函数的作用域为 feature 自身创建一些临时数据。
    // filter active features 不用更担心 feature 会动态变得问题，因为数据引用变化了的话组件肯定重新渲染。
    // CAUTION match 里不能通通过 xxx.value === yyy 来判断，因为这里的判断不是 reactive 的，这样做 feature 不会动态打开。
    const activeFeatures = filterActiveFeatures(FeaturesWithBase, restProps).concat(listeners || [], overwrite)
      .filter(Feature => Feature.match ? Feature.match(processedProps) : true)

    // 2. 开始执行所有 active 的 feature。
    // 为每一个 Feature 创造一个 actionCollectors，作为第一参数传入。在 feature 里通常变量名就叫 fragments。
    // featureFunctionCollectors 是用来为每个 Feature 生产 fragmentsContainer 的,
    // fragmentsContainer 用来收集 相应 Feature 对 Fragment 的改动
    const actionCollectorContainer = createActionCollectorContainer({ props: processedProps, useNamedChildrenSlot: Base.useNamedChildrenSlot })

    activeFeatures.forEach(Feature => {
      const actionCollectorNamedAsFragments = actionCollectorContainer.derive(Feature)
      // 进行 mutations/style/listener 收集。
      Feature(actionCollectorNamedAsFragments)
    })

    // 5. 开始渲染。fragment(vars)(fnOrVnode) 会返回一个所有拼装好 vnodeComputed/vnode。
    // 渲染过程中 actionCollector 会自动 invoke 所有的 feature actions。
    const baseActionCollector = actionCollectorContainer.derive(BaseAsFeature)

    // 得到一个叫做 root 的 FragmentDynamic 对象。
    const rootFragment = baseActionCollector[ROOT_FRAGMENT_NAME](processedProps)(() => Base(processedProps, baseActionCollector, selfHandleRef))
    // CAUTION base 是 nonReactive 的，因为如果数据引用变了，会自动从上面刷新。注意这里会印象到后面的 ref 处理。
    rootFragment.nonReactive = true
    const result = renderFragments(rootFragment, processedProps, selfHandleRef, actionCollectorContainer, processedProps, Base.useNamedChildrenSlot, baseActionCollector, { stylesheet, componentId, instanceId })

    // 6. TODO 自动 forward ref， 如果有 forwardRef 说明组件自己处理。在这里处理还是在 Base 里？？？
    if (ref && !Base.forwardRef) {
      if (result.type === Fragment) {
        invariant(typeof ref === 'function', 'component root is a Fragment, you can only use function ref' )
        result.children.forEach((child) => {
          // TODO 还有 fragment 怎么办？暂时没有考虑。
          child.ref = ref
        })
      } else {
        // CAUTION 这里和 ref 的实现有点耦合，直接打在了 vnode 上。
        // TODO 这里还有很多其他复杂情况，比如组件直接就放回了 vnodeComputed。
        result.ref = ref
      }
    }

    return result
  }

  // CAUTION 要传递用户定义的其他数据
  for(let prop in Base) {
    if (Base.hasOwnProperty(prop)) {
      Component[prop] = Base[prop]
    }
  }

  // 6. TODO 作为 Feature，会需要去修改、抑制 Base 或者其他 Feature 的默认 callback 行为吗？
  // 我们目前没有处理，如果有需求，目前 Feature 声明 propTypes 时会覆盖前面，自己也可以做。
  Component.propTypes = Object.assign({},
    ...FeaturesWithBase.map(f => f.propTypes || {}),
  )

  // CAUTION createComponent 创造的节点默认接受 ref，并且关联到第一个节点。
  Component.forwardRef = true

	// 7. TODO 穿透处理 layout props 的问题。应该任何一个节点协商 acceptLayout 就都能变成 inline/block。这里又有 inline-flex 和 flex 的问题。

  // 8. 允许通过 extend 快速增加 feature
  Component.extend = (...features) => createComponent(Base, featureDefs.concat(features))

  // 9. sideEffect，Axii 第一次 render 时候应该处理
  Component.id = componentId
  Component.stylesheet = stylesheet
  Component.sideEffect = () => {
    const head = document.head || document.getElementsByTagName('head')[0]
    head.appendChild(stylesheet);
  }

  Component.Base = Base
  Component.displayName = Base.displayName || Base.name

  return Component
}



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
export const GLOBAL_NAME = 'global'
const staticClassNamesByComponentId = {}
function renderFragments(fragment, props, selfHandleRef, actionCollectorContainer, upperArgv, useNamedChildrenSlot, baseActionCollector, misc) {
  const { stylesheet, instanceId, componentId } = misc
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
    // CAUTION 从这里开始不要自动处理 函数节点，因为我们需要包装一下，以确保每次重新调用都会 invoke 相应的 feature。
    // 因为 fragments 节点是个 FragmentDynamic 对象，底层是不认识的。经过我们包装后，会去便利里面的这些节点，才能正确 render。
    // const resumeReplace = stopReplaceFunction()

    // 1. render
    // CAUTION 这里让 computed 不再直接计算，是因为后面要处理 renderResult 的过程中药把它替换成一个匿名的 fragments。
    //  以便继续使用 renderFragments 递归对里面的节点进行处理。
    // const resumeComputed = lazyComputed()
    // CAUTION 可以支持直接把 vnode 作为 render。
    let renderResult = (typeof fragment.render === 'function') ? fragment.render() : fragment.render
    // resumeComputed()
    let renderResultToWalk = Array.isArray(renderResult) ? renderResult : [renderResult]


    // 2. 在当前作用域下的参数合集，包括 上层的参数、当前 fragment 上定义的参数。这就是当前 fragment 下所有能用到的变量。
    const commonArgv = {...upperArgv, ...fragment.localVars}

    // 在渲染子 component 之前，我们可以先有个 prepare 函数，这对要提前进行一些变量计算非常有用。
    actionCollectorContainer.forEach(actionCollector => {
      const preparations = actionCollector[fragment.name].getPreparations()
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

    // 3. 开始执行每个 feature 中的 mutations。
    actionCollectorContainer.forEach(featureFunctionCollector => {
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

    /**
     * 4. 递归处理每一个节点，绑定 style 和 开始绑定事件。以下几个情况特别注意：
     * 1. 遇到 Component 节点，还是要往下递归处理 children。因为这表示的是"我们传给 Component 的children"，我们还没有处理完。
     * 2. 如果遇到 vnodeComputed/function。要把 computation 重新替换成一个 匿名的 fragments，以此确保每次重新执行的时候会再进行这个 fragments 处理的过程，
     *     不然可能 vnodeComputed 第二次更新的时候，就没有 feature 的特性了。
     * 3. 如果遇到 fragment，就递归渲染。
     */
    //
    // TODO 这里可以改善一下性能，先取出所有有定义的 elements，再在遍历中去匹配，而不是每个节点都试探去取一次。
    walkVnodes(renderResultToWalk, (walkChildren, originVnode, vnodes) => {
      if (!originVnode) return
      // 如果是数组或者 Fragment，也继续递归
      if (originVnode.type === Array || originVnode.type === Fragment) {
        return walkChildren(originVnode.children)
      }


      // 如果是 fragment，就递归渲染
      // 如果碰到函数或者 lazyVnodeComputed 就要替换成能继续驱动的
      if (originVnode instanceof FragmentDynamic || typeof originVnode === 'function' || isVnodeComputed(originVnode)) {
        invariant(!(isVnodeComputed(originVnode) && !originVnode.computation), 'do not use vnodeComputed in fragment, use function instead')
        const isTrueFragment = originVnode instanceof FragmentDynamic
        const subFragmentToRender = isTrueFragment ?
          originVnode :
          baseActionCollector.anonymous()(originVnode)

        if (!isTrueFragment) {
          // 如果是我们伪造的 fragment，只是为了在 vnodeComputed 重新计算时正确执行，那么就要在 extend 上记录上，因为还要复用 style 和 listener。
          subFragmentToRender.extend = fragment.name
        }
        vnodes[vnodes.indexOf(originVnode)] = renderFragments(subFragmentToRender, props, selfHandleRef, actionCollectorContainer, commonArgv, useNamedChildrenSlot, baseActionCollector, misc)
        return
      }

      // 剩下的只处理普通的节点了，null/字符串 都不处理了。
      // CAUTION 以下的处理都是用 node.name 来匹配的了。type 是真实使用的 dom/Component 类型，name 是 tagName。
      if (!originVnode instanceof VNode || typeof originVnode.type !== 'string') return

      const originStyle = originVnode.attributes.style || {}
      const isOriginStyleRef = isAtom(originStyle)
      const originClassName = originVnode.attributes.className || ''
      const isOriginClassNameRef = isAtom(originClassName)
      const matchedStyles = []
      const matchedPseudoClassStyles = []
      const listenersByEventName = {}

      const sourceFragmentName = fragment.extend || fragment.name
      actionCollectorContainer.forEach(collector => {
        // 收集样式
        matchedStyles.push(
          ...collector[GLOBAL_NAME].elements[originVnode.name].getStyle(),
          ...collector[sourceFragmentName].elements[originVnode.name].getStyle()
        )

        // TODO 收集 PseudoClassNames
        matchedPseudoClassStyles.push(...collector[sourceFragmentName].elements[originVnode.name].getPseudoClassStyle())

        // 收集 listeners
        Object.entries(collector[sourceFragmentName].elements[originVnode.name].getListeners()).forEach(([eventName, listeners ]) => {
          if (!listenersByEventName[eventName]) listenersByEventName[eventName] = []
          listenersByEventName[eventName].push(...listeners)
        })
      })

      // 挂载 样式
      // TODO 未来考虑将"静态的"样式生成 css rule 来防止元素上 style 爆炸。
      if (matchedStyles.length) {
        let shouldStyleBeReactive = isOriginStyleRef || matchedStyles.some(s => isDynamicObject(s))
        const getNextStyle = () => {
          const partialStyle = Object.assign({}, ...matchedStyles.map(style => {
            // 支持对象中局部有函数的情况,
            return (typeof style === 'function') ?
              style(commonArgv) :
              mapValues(style, (rule, name) => {
                return typeof rule === 'function' ? rule(commonArgv, name) : rule
              })
          }))

          return Object.assign({}, isOriginStyleRef ? originStyle.value : originStyle, partialStyle)
        }

        originVnode.attributes.style = shouldStyleBeReactive ? atomComputed(getNextStyle) : getNextStyle()
      }

      // 伪类
      if (matchedPseudoClassStyles.length) {
        let shouldClassNameBeReactive = isOriginClassNameRef
        const makeClassName = (instanceId, pseudoName) => `${instanceId}-${pseudoName}`

        const getNextClassName = () => {
          const classNames = matchedPseudoClassStyles.map(({ name, rules }) => {
            return makeClassName(isDynamicObject(rules) ? instanceId : componentId, name)
          }).join(' ')
          return originClassName.value? `${originClassName.value} ${classNames}` : classNames
        }

        matchedPseudoClassStyles.forEach(({ name, rules }) => {
          const className = makeClassName(isDynamicObject(rules) ? instanceId : componentId, name)
          if (isDynamicObject(rules)) {
            // 动态的，每个组件实例都要单独的 class，因为传入的参数可能不一样，并且需要 watch，动态修改规则
            // watch 参数变化，修改规则
            watch(() => computeDynamicObject(rules, commonArgv), (computedRules) => {
              // TODO 如何修改？目前只会继续插入
              appendRule(stylesheet, className, name, computedRules)
            }, true)
          } else {
            // 静态的，应该只要 inject once，之后的复用就行了
            if (!staticClassNamesByComponentId[componentId]) staticClassNamesByComponentId[componentId] = new Set()
            if (!staticClassNamesByComponentId[componentId].has(name)) {
              appendRule(stylesheet, className, name, rules)
            }
          }
        })

        originVnode.attributes.className = shouldClassNameBeReactive ? atomComputed(getNextClassName) : getNextClassName()
      }

      // TODO 伪元素

      // 挂载监听事件
      if (Object.keys(listenersByEventName).length ){
        Object.entries(listenersByEventName).forEach(([eventName, listeners]) => {
          const originListener =  originVnode.attributes[eventName]
          // 这样写就能支持 originListener 为 undefined | function | [function] 。
          originVnode.attributes[eventName] = ([]).concat(originListener || [], ...listeners.map(listener => (...argv) => listener(...argv, commonArgv)))
        })
      }
      // 5. 开始执行 replace slot。replaceSlot 内部必须保证不要再穿透 vnodeComputed。
      // CAUTION slot children 并没有区分 fragments.
      if(useNamedChildrenSlot && originVnode.attributes.slot && props.children[originVnode.name]) {
        const slotChild = props.children[originVnode.name]
        originVnode.children = [normalizeLeaf((typeof slotChild === 'function') ? slotChild(commonArgv) : slotChild)]
      }

      if (originVnode.children) {
        invariant(Array.isArray(originVnode.children), 'something wrong, children is not a Array')
        walkChildren(originVnode.children)
      }
    })
    // 递归处理结束
    // resumeReplace()
    return renderResult
  }

  // 当为了解约性能并且明确 fragment 不会变化的时候可以标记为 nonReactive。
  if (fragment.render) {
    renderProcess.displayName = `fragment-${fragment.render.displayName || fragment.render.name || fragment.name}`
  }

  return fragment.nonReactive ? renderProcess() : vnodeComputed(renderProcess)
}

