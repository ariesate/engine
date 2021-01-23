import {
  createVnodePath, getVnodeNextIndex,
  resolveFirstLayerElements,
  resolveLastElement,
} from '../common'
import {
  handleInitialVnode,
} from './initialDigest'
import {
  PATCH_ACTION_INSERT,
  PATCH_ACTION_MOVE_FROM,
  PATCH_ACTION_REMAIN,
  PATCH_ACTION_REMOVE,
  PATCH_ACTION_TO_MOVE,
} from '../constant'
import Fragment from '../Fragment'
import {invariant} from "../util";

function handleRemainPatchNode(p, nextPatch, parentNode, prevSiblingNode, parentPath, cnode, view) {
  nextPatch.push(p)
  // 之后用来快速查找 patch
  cnode.view.patchNodesQuickRefById[p.id] = p

  if (typeof p.type === 'object') return

  if (p.type === Array || p.type === Fragment) {
    /* eslint-disable no-use-before-define */
    p.children = handlePatchVnodeChildren(p.children, parentNode, prevSiblingNode, createVnodePath(p, parentPath), cnode, view)
    /* eslint-enable no-use-before-define */
  } else if (typeof p.type === 'string' || p.type === String) {
    if (p.diff !== undefined) {
      // 第一参数表示根据什么去更新，可能会被外面劫持。所以最后还补了一个参数，外部可以动第一个，但不要动最后一个。
      view.updateElement(p, cnode, p)
      delete p.diff
    }

    if (typeof p.type === 'string' && p.children !== undefined) {
      /* eslint-disable no-use-before-define */
      p.children = handlePatchVnodeChildren(p.children, p.element, null, createVnodePath(p, parentPath), cnode, view)
      /* eslint-enable no-use-before-define */
    }
  }
  // CAUTION 理论上剩下的都是 ComponentVnode 了，不需要进一步对比它的 children。
}

function handleRemovePatchNode(p, parentPath, toDestroy, view) {
  if (view.isComponentVnode(p)) {
    // 如果是组件删除 利用 placeHolder 一次性删干净了
    // remove placeholder
    const toDestroyCnode = toDestroy.next[getVnodeNextIndex(p, parentPath)]

    const parentNode = toDestroyCnode.view.startPlaceholder.parentNode
    let toDelete = toDestroyCnode.view.startPlaceholder
    while(toDelete !== toDestroyCnode.view.endPlaceholder) {
      // 先往后移一位，再删当前的。因为如果先删了，nextSibling 就不对了。
      toDelete = toDelete.nextSibling
      parentNode.removeChild(toDelete.previousSibling)
    }
    parentNode.removeChild(toDestroyCnode.view.endPlaceholder)
  } else {

    const elements = resolveFirstLayerElements([p], parentPath, toDestroy)
    elements.forEach((ele) => {
      ele.parentNode.removeChild(ele)
    })
  }
}

export function handleMoveFromPatchNode(p, nextPatch, parentPath, cnode, toInsert, view) {
  // 之后用来快速查找 patch
  cnode.view.patchNodesQuickRefById[p.id] = p

  const elements = resolveFirstLayerElements([p], parentPath, cnode)
  elements.forEach((ele) => {
    toInsert.appendChild(ele)
  })

  // Only component vnode or normal vnode can be marked as 'moveFrom',
  // because user can only use 'key' attribute on this two types in jsx.
  if (typeof p.type === 'string' && p.children !== undefined) {
    /* eslint-disable no-use-before-define */
    p.children = handlePatchVnodeChildren(p.children, p.element, null, createVnodePath(p, parentPath), cnode, view)
    /* eslint-enable no-use-before-define */
  }

  nextPatch.push(p)
  // if (cnodesToUpdateParentNode && isComponentVnode(p)) {
  //   cnodesToUpdateParentNode.push(cnode.next[vnodePathToString(createVnodePath(p, parentPath))])
  // }
  return elements.length
}

// CAUTION No more handle `toMove`, trust `moveFrom` will handle every node.
// In dom manipulation, appendChild will  automatically detach the dom node from its original parent.
function handleToMovePatchNode() {
// function handleToMovePatchNode(p, parentPath, cnode, toMove) {
  // const elements = resolveFirstLayerElements([p], parentPath, cnode)
  // elements.forEach((ele) => {
  //   toMove.appendChild(ele)
  // })
}

/**
 * Consume the patch.
 * During the procedure, we do not handle "remove" type, because if it is component vnode,
 * the real dom ref was attached to the cnode, but the cnode may be removed already,
 * so we can not find the right reference to remove.
 * The patch method only deal with type of "remain", "insert", and "moveFrom".
 *
 * The algorithm can be shortly described as:
 * 1) Find the remained vnode first.
 * 2) Delete every vnode between them.
 * 3) Insert vnode of "insert" type and "moveFrom" type to the right place.
 */
function handlePatchVnodeChildren(patch, parentNode, lastStableSiblingNode, parentPath, cnode, view) {
  const nextPatch = []
  let toInsert = view.createFragment()
  // Save "toMove" type vnode to a fragment for later check if the algorithm is right.
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
      handleRemovePatchNode(p, parentPath, { next: cnode.toDestroyPatch }, view)
    } else if (p.action.type === PATCH_ACTION_REMAIN) {
      // CAUTION 注意 p.patch 可以是 undefined，表示没有任何变化
      // 一旦碰到 remain 的节点，就先把要 insert 的全部插入进去。为什么有个 currentLastStableSiblingNode 判断？？？
      // Handle "toInsert" type first.
      // Trying to insert all new element between two remained elements, So we need to find last remained element first.
      if (toInsert.childNodes.length !== 0) {
        const toInsertBefore = currentLastStableSiblingNode ? currentLastStableSiblingNode.nextSibling : parentNode.childNodes[0]
        currentLastStableSiblingNode = toInsertBefore || toInsert.childNodes[toInsert.childNodes.length - 1]
        parentNode.insertBefore(toInsert, toInsertBefore)
        // toInsert is empty now
      }

      // Only "p.type === Array" condition needs previousSibling
      handleRemainPatchNode(p, nextPatch, parentNode, currentLastStableSiblingNode, parentPath, cnode, view)
      // Find last element in patch node to update currentLastStableSiblingNode

      const lastElement = resolveLastElement(p, parentPath, cnode, view.isComponentVnode)
      if (lastElement) {
        currentLastStableSiblingNode = lastElement
      }
    }
  })

  /**
   * 如果当前没处理完的 toInsert, 说明一直没有碰到 remain 节点。
   * 这时候有几种情况：
   * 1. 如果是组建的顶层节点，那么 currentLastStableSiblingNode 就是自己的 startPlaceholder
   * 2. 如果是某层级下的第一个节点，前面没有兄弟节点，那么没有 currentLastStableSiblingNode，parentNode.childNodes[0]，也没有，
   * 调用 insertBefore 会将其自动插入到该层级中。
   * 3. 如果是某层架下，非第一个节点。那么前面的节点在处理的时候会一致更新 currentLastStableSiblingNode 为处理过的最后一个。插在后面就好了。
   * 以上情况就完备了。
   */
  if (toInsert.childNodes.length !== 0) {
    parentNode.insertBefore(toInsert, currentLastStableSiblingNode ? currentLastStableSiblingNode.nextSibling : parentNode.childNodes[0])
    toInsert = null
  }

  // for debug
  invariant(toMove.childNodes.length === 0, 'to move length not 0')

  return nextPatch
}

// updateDigest only handle one cnode and its new child cnodes.
export default function updateDigest(cnode, view) {
  invariant(cnode.view.parentNode, `cnode has not been initial digested ${cnode.type.displayName}`)
  // CAUTION, 清空一下之前的 refs，只是需要手动维护的。由于我们确定 digest 过程中只要还留存者的 vnode 一定会被遍历到，遍历的时候会 attach 到 quickRefs 上。
  //  所以可以这样用。
  cnode.view.patchNodesQuickRefById = {}
  // 这里返回一个新的 patch 对象的原因是在处理过程中只留下还有用的，remove/moveTo 的都不要了，虽然也可以通过操作原本对象来实现。
  cnode.patch = handlePatchVnodeChildren(cnode.patch, cnode.view.parentNode, cnode.view.startPlaceholder, [], cnode, view)
  // CAUTION toDestroyPatch should be reset after update digest.
  cnode.toDestroyPatch = {}
}
