import { createVnodePath, resolveFirstLayerElements } from '../common'
import { handleInitialVnode } from './initialDigest'
import {
  PATCH_ACTION_INSERT,
  PATCH_ACTION_MOVE_FROM,
  PATCH_ACTION_REMAIN,
  PATCH_ACTION_REMOVE,
} from '../constant'

function resolveFirstElement(vnode, currentPath, cnode) {
  if (vnode === undefined) return null
  if (vnode.type === null) return null

  if (vnode.type === Array) {
    return resolveFirstElement(vnode.children[0], createVnodePath(vnode.children[0], currentPath), cnode)
  }

  if (typeof vnode.type === 'object') {
    const nextCnode = cnode.next[vnode.element]
    return resolveFirstElement(nextCnode.patch[0], createVnodePath(nextCnode.patch[0], []), nextCnode)
  }

  // 普通节点和文字是有的
  if (vnode.element !== undefined) return vnode.element
}

function handleRemainPatchNode(p, nextPatch, parentNode, parentPath, cnode, view) {
  nextPatch.push(p)
  if (p.type === Array) {
    /* eslint-disable no-use-before-define */
    p.children = handlePatchVnodeChildren(p.children, parentNode, createVnodePath(p, parentPath), cnode, view)
    /* eslint-enable no-use-before-define */
  } else if (typeof p.type === 'object') {
    // 不继续递归，我们只处理一层
  } else if (typeof p.type === 'string' || p.type === String) {
    if (p.patch !== undefined) {
      view.updateElement(p, p.element)
      delete p.patch
    }

    if (p.children !== undefined) {
      /* eslint-disable no-use-before-define */
      p.children = handlePatchVnodeChildren(p.children, p.element, createVnodePath(p, parentPath), cnode, view)
      /* eslint-enable no-use-before-define */
    }
  }
}

function handleRemovePatchNode(p, parentPath, toDestroy, parentNode) {
  const elements = resolveFirstLayerElements([p], parentPath, toDestroy)
  elements.forEach((ele) => {
    parentNode.removeChild(ele)
  })
}

function handleMoveFromPatchNode(p, nextPatch, parentPath, cnode, toInsert) {
  const elements = resolveFirstLayerElements([p], parentPath, cnode)
  elements.forEach((ele) => {
    toInsert.appendChild(ele)
  })
  nextPatch.push(p)
  return elements.length
}

/**
 * 由于 destroy 的 cnode 会在 ctree 上被释放掉，所以在 remove 的时候如果碰到这种情况情况就无法准确的找到要移除的 dom 了。
 * 所以我们的算法是：找到 remain 的节点，把 remain 节点和上一个 remain 之间的全部删掉，在拆入中间要 moveFrom 或者新建的。
 * @param patch
 * @param parentNode
 * @param parentPath
 * @param cnode
 * @param view
 * @returns {Array}
 */
function handlePatchVnodeChildren(patch, parentNode, parentPath, cnode, view) {
  const nextPatch = []
  let toInsert = view.createFragment()

  // CAUTION 注意，对于 to_move 我们是不处理的，因为 move_from 处理的时候 dom 节点就已经处理了
  patch.forEach((p) => {
    if (p.action.type === PATCH_ACTION_MOVE_FROM) {
      p.action.type = PATCH_ACTION_REMAIN
      handleMoveFromPatchNode(p, nextPatch, parentPath, cnode, toInsert)
    } else if (p.action.type === PATCH_ACTION_INSERT) {
      p.action.type = PATCH_ACTION_REMAIN
      handleInitialVnode(p, cnode, view, nextPatch, parentPath, toInsert, nextPatch.length)
    } else if (p.action.type === PATCH_ACTION_REMOVE) {
      handleRemovePatchNode(p, parentPath, { next: cnode.toDestroyPatch }, parentNode)
    } else if (p.action.type === PATCH_ACTION_REMAIN) {
      // 先处理掉 toInsert 的
      if (toInsert.childNodes.length !== 0) {
        parentNode.insertBefore(toInsert, resolveFirstElement(p, createVnodePath(p, parentPath), cnode))
        toInsert = view.createFragment()
      }
      handleRemainPatchNode(p, nextPatch, parentNode, parentPath, cnode, view)
    }
  })

  if (toInsert.childNodes.length !== 0) {
    parentNode.appendChild(toInsert)
    toInsert = null
  }

  return nextPatch
}

export default function updateDigest(cnode, view) {
  cnode.patch = handlePatchVnodeChildren(cnode.patch, cnode.view.parentNode, [], cnode, view)
  // 消费过一次就清空
  cnode.toDestroyPatch = {}
}
