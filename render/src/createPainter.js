/**
 * painter 是专门用来解析组件的，也就是执行 render 函数的(结果保存在 cnode 的 ret 字段)。
 * 注意 painter 中没有递归，painter 每次只处理一个组件，但是它会把接下来处理的子组件抛出去，
 * 由外部控制是否需要继续解析。这样未来可以单独在外部实现解析的优化。
 *
 * cnode 中的节点更新会得到新的 ret。
 * next 字段按照 xpath 指向了 ret 中的子组件。注意，虽然 next 中每个对象都是新引用，
 * 但是为了节约性能， children 这个字段直接指向了 vnode 中的 children，没有做深度克隆。
 */

import deepEqual from 'fast-deep-equal'
import { isComponent, walkVnodes, vnodePathToString, isComponentVnode, createVnodePath } from './common'
import { each, indexBy } from './util'
import {
  PATCH_ACTION_INSERT,
  PATCH_ACTION_MOVE_FROM,
  PATCH_ACTION_REMAIN,
  PATCH_ACTION_REMOVE,
  PATCH_ACTION_TO_MOVE,
  DEV_MAX_LOOP,
} from './constant'

function createCnode(vnode, parent) {
  return {
    type: vnode.type,
    props: vnode.attributes || {},
    children: vnode.children,
    parent,
  }
}

/**
 * 新挂载的组件会由 initialize 函数来解析。解析的结果就是创建的 cnode。注意 cnode 中会有引用。
 * 但是不会影响回滚的功能，因为无论是哪种方式的回滚，都应该是完全重绘，所以 initialize 会重新执行。
 * @param cnode
 * @param renderer
 * @param parent parent 为 null 表示是 root，为 false 表示是更新，获取不到 parent。
 * @returns {{}}
 */
function initialize(cnode, renderer) {
  const specificRenderer = cnode.parent === undefined ? renderer.rootRender : renderer.initialRender
  cnode.ret = specificRenderer(cnode, parent)

  const next = {}
  walkVnodes(cnode.ret, (vnode, vnodePath) => {
    if (isComponent(vnode.type)) {
      // CAUTION 注意这里有引用, props/children/parent
      next[vnodePathToString(vnodePath)] = createCnode(vnode, cnode)
    }
  })

  cnode.next = next

  // CAUTION review 只是让外部能得知返回值的，不是它来干预返回的，要干预返回去 scheduler 里。
  return { toInitialize: next }
}

/* ******************
  下面是 update 和 diff
  注意这里的 diff 不只是 last ret 和 ret 的 diff
  last ret 还有可能被替换成 patch。
 ****************** */

function diffNodeDetail(lastVnode, vnode) {
  // 只有两种情况，一种是文字替换，一种是节点 attribute change
  if (lastVnode.type === String && lastVnode.value !== vnode.value) {
    return {
      value: vnode.value,
    }
  }

  // TODO style 的深度对比很麻烦怎么办
  if (!deepEqual(lastVnode.attributes, vnode.attributes)) {
    return {
      value: vnode.attributes,
    }
  }
}

function createPatchNode(lastVnode = {}, vnode, actionType) {
  return {
    ...lastVnode,
    ...vnode,
    action: {
      type: actionType,
    },
  }
}

function handleInsertPatchNode(vnode, currentPath, patch, toInitialize, cnode) {
  patch.push(createPatchNode({}, vnode, PATCH_ACTION_INSERT))
  if (isComponentVnode(vnode)) toInitialize[vnodePathToString(currentPath)] = createCnode(vnode, cnode)
}

function handleRemovePatchNode(lastVnode, patch) {
  patch.push({
    ...lastVnode,
    action: {
      type: PATCH_ACTION_REMOVE,
    },
  })
}

function handleToMovePatchNode(lastVnode, patch) {
  patch.push({
    ...lastVnode,
    action: {
      type: PATCH_ACTION_TO_MOVE,
    },
  })
}

function handleRemainLikePatchNode(lastVnode = {}, vnode, actionType, currentPath, cnode, patch, toInitialize, toRemain) {
  const patchNode = createPatchNode(lastVnode, vnode, actionType)

  if (isComponentVnode(vnode)) {
    const path = vnodePathToString(currentPath)
    toRemain[path] = cnode.next[path]
  } else {
    patchNode.patch = diffNodeDetail(lastVnode, vnode)
    if (vnode.children !== undefined) {
      /* eslint-disable no-use-before-define */
      const childDiffResult = diff(lastVnode.children, vnode.children, currentPath, cnode)
      /* eslint-enable no-use-before-define */
      Object.assign(toInitialize, childDiffResult.toInitialize)
      Object.assign(toRemain, childDiffResult.toRemain)
      patchNode.children = childDiffResult.patch
    }
  }
  patch.push(patchNode)
}


function reconcile(lastVnodes, vnodes, parentPath, cnode) {
  const toRemain = {}
  const toInitialize = {}
  const patch = []
  const lastVnodesLen = lastVnodes.length
  const vnodesLen = vnodes.length
  let lastVnodesIndex = 0
  let vnodesIndex = 0
  const lastVnodeKeys = lastVnodes.map(v => v.key)
  const lastVnodesIndexedByKey = indexBy(lastVnodes, 'key')
  const vnodeKeys = vnodes.map(v => v.key)

  let counter = 0

  while (vnodesIndex < vnodesLen || lastVnodesIndex < lastVnodesLen) {
    counter += 1
    if (counter === DEV_MAX_LOOP) { throw new Error() }

    const lastVnode = lastVnodes[lastVnodesIndex]
    const vnode = vnodes[vnodesIndex]

    // 先处理边界条件
    // 1. vnodes 已经遍历完
    if (!(vnodesIndex < vnodesLen)) {
      if (lastVnode.action === undefined || lastVnode.action.type !== PATCH_ACTION_INSERT) {
        handleRemovePatchNode(lastVnode, patch)
      }
      lastVnodesIndex += 1
      continue
    }

    const currentPath = createVnodePath(vnode, parentPath)
    // 2. 如果 lastVnodes 已经遍历完
    if (!(lastVnodesIndex < lastVnodesLen)) {
      const correspondingLastVnode = lastVnodesIndexedByKey[vnode.key]
      if (correspondingLastVnode !== undefined && correspondingLastVnode.type === vnode.type) {
        handleRemainLikePatchNode(correspondingLastVnode, vnode, PATCH_ACTION_MOVE_FROM, currentPath, cnode, patch, toInitialize, toRemain)
      } else {
        handleInsertPatchNode(vnode, currentPath, patch, toInitialize, cnode)
      }

      vnodesIndex += 1
      continue
    }

    const { action = { type: PATCH_ACTION_REMAIN } } = lastVnode
    // 1. 如果原本是要 remove 的那么仍然 remove
    if (action.type === PATCH_ACTION_REMOVE) {
      patch.push(lastVnode)
      lastVnodesIndex += 1
      continue
    }

    // 剩下的都是 insert/to_move/remain 了
    // 2. 如果原本的 key 在新的里面没有了，那么 remove，如果本身就是insert 的，直接跳过不用管就行了
    if (!vnodeKeys.includes(lastVnode.key)) {
      if (action.type !== PATCH_ACTION_INSERT) {
        handleRemovePatchNode(lastVnode, patch)
      }
      lastVnodesIndex += 1
      continue
    }

    // 剩下的都是原来的 key 在新的里面还有的了
    // 3. 如果 vnode.key 在旧的中不存在，说明是新增的
    if (!lastVnodeKeys.includes(vnode.key)) {
      handleInsertPatchNode(vnode, currentPath, patch, toInitialize, cnode)
      vnodesIndex += 1
      continue
    }

    // 剩下的都是 vnode.key 在原来的中也存在的
    // 4. 如果 key 相同
    if (vnode.key === lastVnode.key) {
      // 但是 type 不同，那么先要移除原来的，再新增现在的
      if (vnode.type !== lastVnode.type) {
        handleRemovePatchNode(lastVnode, patch)
        handleInsertPatchNode(vnode, currentPath, patch, toInitialize, cnode)
        // type 也相同
      } else {
        handleRemainLikePatchNode(lastVnode, vnode, PATCH_ACTION_REMAIN, currentPath, cnode, patch, toInitialize, toRemain)
      }
      lastVnodesIndex += 1
      vnodesIndex += 1
    } else {
      // 剩下的都是 key 不同的了, 那么只把 lastVnodesIndex + 1，等待子序列
      handleToMovePatchNode(lastVnode, patch)
      lastVnodesIndex += 1
      // handleRemainLikePatchNode(lastVnode, vnode, PATCH_ACTION_MOVE_FROM, currentPath, cnode, patch, toInitialize, toRemain)
    }
  }

  return {
    toInitialize,
    toRemain,
    patch,
  }
}

// lastVnodes === lastPatch
function diff(lastVnodesOrPatch, vnodes, parentPath, cnode) {
  const lastNext = { ...cnode.next }
  const toInitialize = {}
  const toRemain = {}
  const lastVnodes = lastVnodesOrPatch.filter(lastVnode => lastVnode.action === undefined || lastVnode.action.type !== PATCH_ACTION_MOVE_FROM)

  const result = reconcile(lastVnodes, vnodes, parentPath, cnode)
  Object.assign(toInitialize, result.toInitialize)
  Object.assign(toRemain, result.toRemain)
  each(toRemain, (_, key) => {
    delete lastNext[key]
  })

  // 这是提供给 patch 用来查找 cnode 上的 ref dom 的，一定要用 last 的值覆盖当前值
  const lastToDestroyPatch = cnode.toDestroyPatch || {}
  const toDestroyPatch = { ...lastNext, ...lastToDestroyPatch }

  return { toInitialize, toRemain, toDestroy: lastNext, patch: result.patch, toDestroyPatch }
}


/**
 * update 函数用来更新某一个 cnode 节点，组件的 diff 就是由这个函数决定的。
 * 注意，这里真正关键的数据是 patch。patch 上会带有 view 提供的 dom ref。
 * 它同时也是被 view 消费的。
 * @param cnode
 * @param renderer
 * @returns {{}}
 */
function update(cnode, renderer) {
  const render = renderer.updateRender
  const lastPatch = cnode.patch || cnode.ret
  cnode.ret = render(cnode, cnode.parent)
  const diffResult = diff(lastPatch, cnode.ret, [], cnode)

  cnode.patch = diffResult.patch
  cnode.next = { ...diffResult.toInitialize, ...diffResult.toRemain }

  // CAUTION 挂在 cnode 上等 view 消费
  cnode.toDestroyPatch = diffResult.toDestroyPatch
  // 注意返回的是引用
  return diffResult
}


/**
 * painter 是一个和 controller 进行约定的对象，controller 每次调用它处理一个组件的解析。
 * 在 painter 中还有个 background 的概念，background 控制着背后的所有状态。
 * background 通知 controller 合时 repaint。
 *
 * @param backgroundArgv
 * @param renderer
 * @returns {{handle: handle }}
 */
export default function createPainter(renderer) {
  function handle(cnode) {
    return (cnode.ret === undefined) ?
      initialize(cnode, renderer) :
      update(cnode, renderer)
  }

  return {
    handle,
  }
}
