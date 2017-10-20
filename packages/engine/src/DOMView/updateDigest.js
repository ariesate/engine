import { createVnodePath, resolveFirstLayerElements, resolveLastElement } from '../common'
import { handleInitialVnode } from './initialDigest'
import {
  PATCH_ACTION_INSERT,
  PATCH_ACTION_MOVE_FROM,
  PATCH_ACTION_REMAIN,
  PATCH_ACTION_REMOVE,
  PATCH_ACTION_TO_MOVE,
} from '../constant'

function handleRemainPatchNode(p, nextPatch, parentNode, prevSiblingNode, parentPath, cnode, view) {
  nextPatch.push(p)
  // 组件不继续递归，我们只处理一层
  if (typeof p.type === 'object') return

  if (p.type === Array) {
    /* eslint-disable no-use-before-define */
    p.children = handlePatchVnodeChildren(p.children, parentNode, prevSiblingNode, createVnodePath(p, parentPath), cnode, view)
    /* eslint-enable no-use-before-define */
  } else if (typeof p.type === 'string' || p.type === String) {
    if (p.patch !== undefined) {
      view.updateElement(p, p.element)
      delete p.patch
    }

    if (typeof p.type === 'string' && p.children !== undefined) {
      /* eslint-disable no-use-before-define */
      p.children = handlePatchVnodeChildren(p.children, p.element, null, createVnodePath(p, parentPath), cnode, view)
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

export function handleMoveFromPatchNode(p, nextPatch, parentPath, cnode, toInsert, view) {
  const elements = resolveFirstLayerElements([p], parentPath, cnode)
  elements.forEach((ele) => {
    toInsert.appendChild(ele)
  })

  // move from 的，只可能是 component 或者原生 dom。因为只有这上面能写 key。
  // component 的不递归处理
  if (typeof p.type === 'string' && p.children !== undefined) {
    /* eslint-disable no-use-before-define */
    p.children = handlePatchVnodeChildren(p.children, p.element, null, createVnodePath(p, parentPath), cnode, view)
    /* eslint-enable no-use-before-define */
  }

  nextPatch.push(p)
  return elements.length
}

function handleToMovePatchNode() {
// function handleToMovePatchNode(p, parentPath, cnode, toMove) {
  // CAUTION 不再处理 toMove, 因为加入了 transfer 的情况，不确定
  // moveFrom 会不会在 toMove 前处理，如果会，那么 toMove 再处理就错了
  // const elements = resolveFirstLayerElements([p], parentPath, cnode)
  // elements.forEach((ele) => {
  //   toMove.appendChild(ele)
  // })
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
function handlePatchVnodeChildren(patch, parentNode, lastStableSiblingNode, parentPath, cnode, view) {
  const nextPatch = []
  let toInsert = view.createFragment()
  // 这里用 fragment 用来保存 toMove 的 dom 引用，主要是因为
  // 如果 dom 被 move from 处理了，那么 dom 会自动从 fragment 中被去掉。
  // 最后检查一下 fragment 就可以值到算法有没有出错。
  const toMove = view.createFragment()
  let currentLastStableSiblingNode = lastStableSiblingNode

  patch.forEach((p) => {
    if (p.action.type === PATCH_ACTION_TO_MOVE) {
      handleToMovePatchNode(p, parentPath, cnode, toMove)
    } else if (p.action.type === PATCH_ACTION_MOVE_FROM) {
      p.action.type = PATCH_ACTION_REMAIN
      handleMoveFromPatchNode(p, nextPatch, parentPath, cnode, toInsert, view)
    } else if (p.action.type === PATCH_ACTION_INSERT) {
      p.action.type = PATCH_ACTION_REMAIN
      handleInitialVnode(p, cnode, view, nextPatch, parentPath, toInsert, nextPatch.length)
    } else if (p.action.type === PATCH_ACTION_REMOVE) {
      handleRemovePatchNode(p, parentPath, { next: cnode.toDestroyPatch }, parentNode)
    } else if (p.action.type === PATCH_ACTION_REMAIN) {
      // 先处理掉 toInsert 的
      const toInsertBefore = currentLastStableSiblingNode === null ? parentNode.childNodes[0] : currentLastStableSiblingNode.nextSibling
      if (toInsert.childNodes.length !== 0) {
        currentLastStableSiblingNode = toInsert.childNodes[toInsert.childNodes.length - 1]
        parentNode.insertBefore(toInsert, toInsertBefore)
        toInsert = view.createFragment()
      }

      // 好像只针对 p.type === Array 这种情况要 previousSibling，其他都不用
      handleRemainPatchNode(p, nextPatch, parentNode, currentLastStableSiblingNode, parentPath, cnode, view)
      // 还要找到 p 中最后一个 ele, 更新 currentLastStableSiblingNode
      const lastElement = resolveLastElement(p, parentPath, cnode)
      if (lastElement) {
        currentLastStableSiblingNode = lastElement
      }
    }
  })

  if (toInsert.childNodes.length !== 0) {
    parentNode.insertBefore(toInsert, currentLastStableSiblingNode ? currentLastStableSiblingNode.nextSibling : null)
    toInsert = null
  }

  if (toMove.childNodes.length !== 0) {
    throw new Error('to move length not 0')
  }

  return nextPatch
}

// 我们提供的 updateDigest 始终只处理一个 cnode 以及下面新建的 cnode。
export default function updateDigest(cnode, view) {
  cnode.patch = handlePatchVnodeChildren(cnode.patch, cnode.view.parentNode, null, [], cnode, view)
  // 消费过一次就清空
  cnode.toDestroyPatch = {}
  view.collectUpdateDigestedCnode(cnode)
}
