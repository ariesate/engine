/**
 * painter 是专门用来解析组件的，也就是执行 render 函数的(结果保存在 cnode 的 ret 字段)。
 * 注意 painter 中没有递归，painter 每次只处理一个组件，但是它会把接下来处理的子组件抛出去，
 * 由外部控制是否需要继续解析。这样未来可以单独在外部实现解析的优化。
 *
 * cnode 中的节点更新会得到新的 ret。
 * next 字段按照 xpath 指向了 ret 中的子组件。注意，虽然 next 中每个对象都是新引用，
 * 但是为了节约性能， children 这个字段直接指向了 vnode 中的 children，没有做深度克隆。
 */

import { isComponent, walkVnodes, vnodePathToString, noop } from './common'

/**
 * 新挂载的组件会由 initialize 函数来解析。解析的结果就是创建的 cnode。注意 cnode 中会有引用。
 * 但是不会影响回滚的功能，因为无论是哪种方式的回滚，都应该是完全重绘，所以 initialize 会重新执行。
 * @param cnode
 * @param renderer
 * @param parent parent 为 null 表示是 root，为 false 表示是更新，获取不到 parent。
 * @returns {{}}
 */
function initialize(cnode, renderer, parent) {
  const specificRenderer = parent === null ? renderer.rootRender : renderer.initialRender
  const render = specificRenderer.fn || specificRenderer
  const review = specificRenderer.review || noop
  cnode.ret = render(cnode, parent)

  const next = {}
  walkVnodes(cnode.ret, (vnode, vnodePath) => {
    if (isComponent(vnode.name)) {
      // CAUTION 注意这里有引用, props/children/parent
      next[vnodePathToString(vnodePath)] = {
        type: vnode.name,
        props: vnode.attributes || {},
        children: vnode.children,
        parent,
      }
    }
  })

  cnode.next = next

  // CAUTION review 只是让外部能得知返回值的，不是它来干预返回的，要干预返回去 scheduler 里。
  const result = [next, {}, {}]
  review(cnode, result)
  return result
}

/**
 * update 函数用来更新某一个 cnode 节点，组件的 diff 算法，以及是否递归更新就是由这个函数决定的
 * @param cnode
 * @param renderer
 * @returns {{}}
 */
function update(cnode, renderer) {
  const render = renderer.updateRender.fn || renderer.updateRender
  const review = renderer.updateRender.review || noop
  cnode.ret = render(cnode, cnode.parent)
  const lastNext = { ...cnode.next }

  const next = {}
  const toInitialize = {}
  const toRemain = {}
  // TODO 这里的 diff 算法没有处理 key 的情况
  walkVnodes(cnode.ret, (current, vnodePath) => {
    if (isComponent(current.type)) {
      const path = vnodePathToString(vnodePath)
      // 说明是新增的
      if (lastNext[path] === undefined) {
        next[path] = {
          type: current.name,
          props: current.attributes || {},
          // 注意这里有引用
          children: current.children,
          // CAUTION 注意，这里指向了当前节点
          parent: cnode,
        }
        toInitialize[path] = next[path]
      } else {
        // 说明要复用
        next[path] = lastNext[path]
        toRemain[path] = lastNext[path]
        // 同时这里删除一下。最后 lastNext 留下来的就是要销毁的
        delete lastNext[path]
      }
    }
  })


  cnode.next = next
  // 我们只处理要新建的和要删除的，已有的不再管，这样就实现了组件的精确更新

  // 注意返回的是引用
  const result = [toInitialize, lastNext, toRemain]
  review(cnode, result)
  return result
}


/**
 * painter 是一个和 controller 进行约定的对象，controller 每次调用它处理一个组件的解析。
 * 在 painter 中还有个 background 的概念，background 控制着背后的所有状态。
 * background 通知 controller 合时 repaint。
 *
 * @param backgroundArgv
 * @param renderer
 * @returns {{handle: handle, destroy: destroy, onChange: (function(*): *), dump: (function()), load: (function())}}
 */
export default function createPainter(renderer) {
  function handle(cnode, parent) {
    return (cnode.ret === undefined) ?
      initialize(cnode, renderer, parent) :
      update(cnode, renderer)
  }

  return {
    handle,
    dump() {},
    load() {},
  }
}
