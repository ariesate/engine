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

  // Only component vnode or normal vnode can be marked as 'moveFrom',
  // because user can only create 'key' attribute on this two types.
  if (typeof p.type === 'string' && p.children !== undefined) {
    /* eslint-disable no-use-before-define */
    p.children = handlePatchVnodeChildren(p.children, p.element, null, createVnodePath(p, parentPath), cnode, view)
    /* eslint-enable no-use-before-define */
  }

  nextPatch.push(p)
  return elements.length
}

// CAUTION no more handle toMove, trust moveFrom will handle every node.
function handleToMovePatchNode() {
// function handleToMovePatchNode(p, parentPath, cnode, toMove) {
  // const elements = resolveFirstLayerElements([p], parentPath, cnode)
  // elements.forEach((ele) => {
  //   toMove.appendChild(ele)
  // })
}

/**
 * During patch, we do not handle 'remove' type, because cnode maybe already removed
 * so we can not find the right reference to remove.
 * The patch algorithm only deal type of remain/insert/moveFrom.
 * We find the remained vnode first, delete every node between them, then insert insert/moveFrom type to the right place.
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
  // Save toMove to fragment for later check if algorithm runs right.
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
      // Handle toInsert first
      const toInsertBefore = currentLastStableSiblingNode === null ? parentNode.childNodes[0] : currentLastStableSiblingNode.nextSibling
      if (toInsert.childNodes.length !== 0) {
        currentLastStableSiblingNode = toInsert.childNodes[toInsert.childNodes.length - 1]
        parentNode.insertBefore(toInsert, toInsertBefore)
        toInsert = view.createFragment()
      }

      // Only condition of 'p.type === Array' needs previousSibling
      handleRemainPatchNode(p, nextPatch, parentNode, currentLastStableSiblingNode, parentPath, cnode, view)
      // find last element in patch node to update currentLastStableSiblingNode
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

// updateDigest only handle one cnode and its new child cnodes.
export default function updateDigest(cnode, view) {
  cnode.patch = handlePatchVnodeChildren(cnode.patch, cnode.view.parentNode, null, [], cnode, view)
  // CAUTION toDestroyPatch should be reset update digest.
  cnode.toDestroyPatch = {}
  view.collectUpdateDigestedCnode(cnode)
}
