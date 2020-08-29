/**
 * 使用方法的设计
 *  - operator overload？
 *  - 基本 api
 *
 * 渲染
 *  - 组件化支持
 *  - 更新节点关联
 *
 * $bind
 * usePerformance 的实现
 *
 * 场景:
 *  外部和内部是否约定数据结构？
 *  1. 组件是自己的，希望把数据修改过程交给"子组件，相当于委托"。
 *    $bind：
 *    function Top(){
 *      const $prop1 = reactive({})
 *      const $prop2 = reactive({})
 *
 *      $prop1.watch(() => {})
 *
 *      function onAddOne(...argv, e) {
 *        // 可以 preventDefault/stopPropagation
 *        // 不执行 shouldRecompute 就不会 recomputed。
 *      }
 *
 *      return <Editor $bind:prop1={$prop1} $bind:props2={$prop2} onAddOn={onAddOne}/>
 *    }
 *
 *    function Editor({$prop1, $prop2}) {
 *      const { $a, $b } = reactive(() => {
 *        return {$a, $b}
 *      }, {
 *        $prop1($prop1SetterProxy, $a, $b) {
 *        },
 *        $prop2($prop2SetterProxy, $a, $b) {
 *        }
 *      }
 *
 *      function addOne() {
 *        $a += 1
 *        $b += 2
 *      }
 *
 *      return <div onClick:eventName={addOne}>{$a} {$b}</div>
 *    }
 *
 *  1. 完全委托修改 $bind。子元素实时变化。完全相当于一个内部类。
 *
 *  2. 半委托修改(draft)，应该从数据使用上来考虑，因为 draft 肯定是外部知晓的概念。内部不应该知晓
 *    $draftContent = draft($content)
 *    如果要重新传入了：
 *    syncFromSource($draftContent)
 *    如果要用 draft 的内容。
 *    sync($content, $draftContent)
 *
 *    理论上 e 的设计是适配层的设计，很脏。以下才更适合。如果要读 scroll 之类的东西，应该是声明好的数据。
 *    onXXX(nextProps) {
 *      如果在这里修改了 nextProps，说明要修改，如果没有，说明不用。自然就可以优化 Performance。
 *      return false 就是不修改任何数据。
 *    }
 *
 *  没有想清楚为什么很脏的事情？？？？？？
 *  所有会改变数据地方，应该都有明确的语意。
 *  因此，watch data 时如果做了改变数据的行为，就会丢失语意，让数据变脏。
 *
 *  当然我们的的数据之间不可能完全正交，这种逻辑应该写在哪里？应该自动关联在数据上。
 *
 *  // 怎么描述？？？couple 可能会互相依赖。
 *  couple([$column, $dataSource], () => {
 *  })
 *
 */


/**
 * 记住, view/painter/scheduler 是三个独立的基础部分，他们实现了各自的功能，
 * 并且允许外部通过接口获取内部的信息。
 *
 * view: 渲染 dom，提供统一的事件回调接口
 * painter: 执行 cnode 的 initialize 和 update
 * scheduler: 调用 painter 进行工作
 *
 * controller 在这里与三个基础部分都有关系。并且同时通过插入接口来控制它们的内部。
 * 又通过 receive 来控制它们的 api。看起来有点奇怪，但只要把 controller 想成一个为了
 * 开发者方便而设计胶水层概念就可以了。
 */
// import createScheduler from '../../engine/createScheduler'
// import createPainter from '../../engine/createPainter'
// import createDOMView from '../../engine/DOMView/createDOMView'
// import createVnodeElement, { cloneElement as cloneVnodeElement } from '../../engine/createElement'
import createScheduler from '@ariesate/are/createScheduler'
import createPainter from '@ariesate/are/createPainter'
import createDOMView from '@ariesate/are/DOMView/createDOMView'
import createAxiiController from './createAxiiController'

// TODO createElement 是不是应该在这里重写，这样才能通过 renderContext 来实现劫持！。
export { default as createElement,  cloneElement, normalizeLeaf, normalizeChildren } from '@ariesate/are/createElement'
export { default as Fragment } from '@ariesate/are/Fragment'
export { default as VNode } from '@ariesate/are/VNode'
export { default as vnodeComputed } from './vnodeComputed'
export * from './reactive'
export { default as propTypes } from './propTypes'
export { default as derive } from './derive'
export { default as useImperativeHandle } from './useImperativeHandle'
export { default as createRef } from './createRef'
export { default as watch } from './watch'
export { StyleEnum, StyleRule } from './StyleManager'
export { default as createFlatChildrenProxy } from './createFlatChildrenProxy'
export { isComponentVnode } from './createAxiiController'
export { invariant } from './util'
export { default as createComponent} from './component/createComponent'
export { flattenChildren } from './component/utils'
export { default as Scenario, createRange, matrixMatch } from './Scenario'

export function render(vnode, domElement, ...controllerArgv) {
  const controller = createAxiiController(...controllerArgv)

  const view = createDOMView(controller.observer, domElement, controller.isComponentVnode, controller.digestObjectLike)
  const painter = createPainter(controller.renderer, controller.isComponentVnode, controller.ComponentNode)

  const scheduler = createScheduler(painter, view, controller.supervisor)

  // 这里这么写只是因为我们的 controller 里同时可以控制 repaint
  controller.receiveScheduler(scheduler)
  controller.paint(vnode)

  return controller
}

