/**
 * Variable Name Convention
 * cnode: component tree node, see function `createCnode` from attributes.
 * ret: return value of render method.
 * patch: vnode diff result, it tells view how to handle real dom.
 *
 * Description Of Painter
 * Painter is the exact object to handle cnode's painting.
 * It only handle one cnode. For recursive painting, it needs
 * scheduler to call its handle method from outside.
 *
 * The painting result consist of tow parts:
 *  1. vnode diff result(we use "patch" as variable name)
 *  2. child cnodes(we use "next" as variable name)
 *
 * We also implement a new feature called 'transfer key'.
 * It allow user to appoint which child cnode should be reused,
 * even if it is not in the same place after re-render.
 */

import deepEqual from 'fast-deep-equal'
import {
  isComponent,
  walkRawVnodes,
  makeVnodeTransferKey,
  vnodePathToString,
  isComponentVnode,
  createVnodePath,
  makeVnodeKey,
  getVnodeNextIndex,
  walkVnodes,
} from './common'
import { each, indexBy } from './util'
import {
  PATCH_ACTION_INSERT,
  PATCH_ACTION_MOVE_FROM,
  PATCH_ACTION_REMAIN,
  PATCH_ACTION_REMOVE,
  PATCH_ACTION_TO_MOVE,
  DEV_MAX_LOOP,
} from './constant'

/**
 * The creator of cnode.
 * @param vnode
 * @param parent Parent cnode.
 * @returns {{type: object, props: object, children: vnode, parent: cnode}}
 */
function createCnode(vnode, parent) {
  return {
    type: vnode.type,
    props: vnode.attributes || {},
    children: vnode.children,
    parent,
  }
}

/**
 *  Three things:
 *   1. Normalize the return value of render method,
 *   attach key to every vnode, so out diff algorithm can be simpler.
 *   2. Calculate child cnode, return as `next`.
 *   3. Collect vnodes with transfer key.
 * @param ret
 * @param cnode
 * @returns {{next: {}, ret: *}}
 */
function prepareRetForAttach(ret, cnode) {
  const next = {}
  const transferKeyedVnodes = {}
  walkRawVnodes(ret, (vnode, path, parentVnodePath = []) => {
    vnode.key = makeVnodeKey(vnode, path[path.length - 1])
    // CAUTION if transferKey is undefined， then `makeVnodeTransferKey` will return undefined
    vnode.transferKey = makeVnodeTransferKey(vnode)
    if (isComponent(vnode.type)) {
      const nextIndex = getVnodeNextIndex(vnode, parentVnodePath)
      // CAUTION cnode has object reference inside: props/children/parent
      next[nextIndex] = createCnode(vnode, cnode)
      if (vnode.transferKey !== undefined) {
        transferKeyedVnodes[vnode.transferKey] = vnode
      }
    }

    return parentVnodePath.concat(vnode.key)
  })

  return { next, ret, transferKeyedVnodes }
}

/**
 * The actual entry point to handle cnode.
 * This method is used to handle new cnode.
 * @param cnode
 * @param renderer The object to call render method, it can inject arguments.
 * @returns {{}} The child cnodes.
 */
function initialize(cnode, renderer) {
  const specificRenderer = cnode.parent === undefined ? renderer.rootRender : renderer.initialRender
  const { next, ret, transferKeyedVnodes } = prepareRetForAttach(specificRenderer(cnode, cnode.parent), cnode)

  cnode.ret = ret
  cnode.next = next
  cnode.transferKeyedVnodes = transferKeyedVnodes

  return { toInitialize: next }
}

/* *******************************
 * Diff Algorithm Functions Begins
 ****************************** */

/**
 * Diff the detail of two vnode
 * @param lastVnode
 * @param vnode
 * @returns {*}
 */
function diffNodeDetail(lastVnode, vnode) {
  if (lastVnode.type === String && lastVnode.value !== vnode.value) {
    return {
      value: vnode.value,
    }
  }

  // TODO Improve performance. Maybe only a style changed.
  if (!deepEqual(lastVnode.attributes, vnode.attributes)) {
    return {
      attributes: vnode.attributes,
    }
  }
}

/**
 * Patch or PatchNode is a vnode style object, with a additional key `action`.
 * The action type indicates that the new vnode should be insert/remain/remove
 * from last vnode tree.
 * @param lastVnode
 * @param vnode
 * @param actionType
 * @returns {{action: {type: *}}}
 */
function createPatchNode(lastVnode = {}, vnode, actionType) {
  return {
    ...lastVnode,
    ...vnode,
    action: {
      type: actionType,
    },
  }
}

/**
 * If the diff algorithm tells this vnode is new, then we need this method to handle its children.
 * We need to check if there is new cnode, or cnode with transfer key, and attach the result
 * to `toInitialize` adn `toRemain`.
 * @param vnode
 * @param currentPath
 * @param patch
 * @param toInitialize
 * @param toRemain
 * @param cnode
 */
function handleInsertPatchNode(vnode, currentPath, patch, toInitialize, toRemain, cnode) {
  patch.push(createPatchNode({}, vnode, PATCH_ACTION_INSERT))
  if (isComponentVnode(vnode)) {
    const nextIndex = vnode.transferKey === undefined ? vnodePathToString(currentPath) : vnode.transferKey
    toInitialize[nextIndex] = createCnode(vnode, cnode)
  } else if (vnode.children !== undefined) {
    walkVnodes(vnode.children, (childVnode, vnodePath) => {
      if (isComponentVnode(childVnode)) {
        const nextIndex = childVnode.transferKey === undefined ? vnodePathToString(currentPath.concat(vnodePath)) : childVnode.transferKey

        // because current vnode is a new vnode, so its child remains under only one
        // condition, that is having a transferKey.
        if (childVnode.transferKey !== undefined && cnode.next[nextIndex] !== undefined) {
          toRemain[nextIndex] = cnode.next[nextIndex]
          if (childVnode.transferKey !== undefined) {
            childVnode.action = { type: PATCH_ACTION_MOVE_FROM }
          }
        } else {
          toInitialize[nextIndex] = createCnode(childVnode, cnode)
        }

        return true
      }
    })
  }
}

function handleRemovePatchNode(lastVnode, patch) {
  patch.push(createPatchNode(lastVnode, {}, PATCH_ACTION_REMOVE))
}

/**
 * If a vnode changed place between its siblings, we use this method to mark it.
 * @param lastVnode
 * @param patch
 */
function handleToMovePatchNode(lastVnode, patch) {
  patch.push(createPatchNode(lastVnode, {}, PATCH_ACTION_TO_MOVE))
}

/**
 * If a vnode should remain, we use this method to (recursively) handle its children.
 * @param lastVnode
 * @param vnode
 * @param actionType
 * @param currentPath
 * @param cnode
 * @param patch
 * @param toInitialize
 * @param toRemain
 * @param nextTransferKeyedVnodes
 */
function handleRemainLikePatchNode(lastVnode = {}, vnode, actionType, currentPath, cnode, patch, toInitialize, toRemain, nextTransferKeyedVnodes) {
  const patchNode = createPatchNode(lastVnode, vnode, actionType)

  if (isComponentVnode(vnode)) {
    const path = vnodePathToString(currentPath)
    toRemain[path] = cnode.next[path]
  } else {
    patchNode.patch = diffNodeDetail(lastVnode, vnode)
    if (vnode.children !== undefined) {
      /* eslint-disable no-use-before-define */
      const childDiffResult = diff(lastVnode.children, vnode.children, currentPath, cnode, nextTransferKeyedVnodes)
      /* eslint-enable no-use-before-define */
      Object.assign(toInitialize, childDiffResult.toInitialize)
      Object.assign(toRemain, childDiffResult.toRemain)
      patchNode.children = childDiffResult.patch
    }
  }
  patch.push(patchNode)
}

/**
 * The entry point to create a vnode patch, and new child cnodes information.
 * @param lastVnodes
 * @param vnodes
 * @param parentPath
 * @param cnode
 * @param nextTransferKeyedVnodes
 * @returns {{toInitialize: {}, toRemain: {}, patch: Array}}
 */
function createPatch(lastVnodes, vnodes, parentPath, cnode, nextTransferKeyedVnodes) {
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
    if (counter === DEV_MAX_LOOP) { throw new Error(`patch loop over ${DEV_MAX_LOOP} times.`) }

    const lastVnode = lastVnodes[lastVnodesIndex]
    const vnode = vnodes[vnodesIndex]

    // Handle transferKey first. Only component vnode can have transferKey.
    if (lastVnode !== undefined &&
      isComponentVnode(lastVnode) &&
      lastVnode.transferKey !== undefined
    ) {
      // If it no more exist
      if (nextTransferKeyedVnodes[lastVnode.transferKey] === undefined) {
        handleRemovePatchNode(lastVnode, patch)
        lastVnodesIndex += 1
        continue
      }
      // If it still exist and vnode have the same type, we mark it as to remain。
      if (vnode !== undefined && vnode.type === lastVnode.type && vnode.transferKey === lastVnode.transferKey) {
        handleRemainLikePatchNode(lastVnode, vnode, PATCH_ACTION_REMAIN, [getVnodeNextIndex(vnode)], cnode, patch, toInitialize, toRemain, nextTransferKeyedVnodes)
        lastVnodesIndex += 1
        vnodesIndex += 1
        continue
      }
      // If it still exist but vnode type is different，mark it move。
      // FIXME, move or remove?
      handleToMovePatchNode(lastVnode, patch)
      lastVnodesIndex += 1
      continue
    }

    if (vnode !== undefined &&
      isComponentVnode(vnode) &&
      vnode.transferKey !== undefined
    ) {
      if (cnode.next[vnode.transferKey] === undefined) {
        // If it is new
        handleInsertPatchNode(vnode, [getVnodeNextIndex(vnode)], patch, toInitialize, toRemain, cnode)
      } else {
        // If it is not, mark it as `moveFrom`
        handleRemainLikePatchNode(cnode.transferKeyedVnodes[vnode.transferKey], vnode, PATCH_ACTION_MOVE_FROM, [getVnodeNextIndex(vnode)], cnode, patch, toInitialize, toRemain, nextTransferKeyedVnodes)
      }

      // We have handled the `lastVnode === vnode` condition before, so we continue here
      vnodesIndex += 1
      continue
    }

    // All condition with transferKey have been handled before, now we handle normal key diff.
    // Handle boundary conditions first.
    // 1. vnodes exceeds range
    if (!(vnodesIndex < vnodesLen)) {
      if (lastVnode.action === undefined || lastVnode.action.type !== PATCH_ACTION_INSERT) {
        handleRemovePatchNode(lastVnode, patch)
      }
      lastVnodesIndex += 1
      continue
    }

    const currentPath = createVnodePath(vnode, parentPath)
    // 2. lastVnodes exceeds range
    if (!(lastVnodesIndex < lastVnodesLen)) {
      const correspondingLastVnode = lastVnodesIndexedByKey[vnode.key]
      if (correspondingLastVnode !== undefined && correspondingLastVnode.type === vnode.type) {
        handleRemainLikePatchNode(correspondingLastVnode, vnode, PATCH_ACTION_MOVE_FROM, currentPath, cnode, patch, toInitialize, toRemain, nextTransferKeyedVnodes)
      } else {
        handleInsertPatchNode(vnode, currentPath, patch, toInitialize, toRemain, cnode)
      }

      vnodesIndex += 1
      continue
    }

    const { action = { type: PATCH_ACTION_REMAIN } } = lastVnode
    // 1. remove + remove = remove
    if (action.type === PATCH_ACTION_REMOVE) {
      patch.push(lastVnode)
      lastVnodesIndex += 1
      continue
    }

    // Only insert/to_move/remain left now.
    // 2. If key not exist anymore, vnode should be removed.
    // If the lastVnode was marked as `insert`,
    // that means real dom has not been inserted,
    // we just continue.
    if (!vnodeKeys.includes(lastVnode.key)) {
      if (action.type !== PATCH_ACTION_INSERT) {
        handleRemovePatchNode(lastVnode, patch)
      }
      lastVnodesIndex += 1
      continue
    }

    // The left condition is vnode key still exist.
    // If vnode.key is totally new
    if (!lastVnodeKeys.includes(vnode.key)) {
      handleInsertPatchNode(vnode, currentPath, patch, toInitialize, toRemain, cnode)
      vnodesIndex += 1
      continue
    }

    // If vnode.key remains
    // If same key
    if (vnode.key === lastVnode.key) {
      // different type, then we remove the old, insert the new.
      if (vnode.type !== lastVnode.type) {
        handleRemovePatchNode(lastVnode, patch)
        handleInsertPatchNode(vnode, currentPath, patch, toInitialize, toRemain, cnode)
        // same type
      } else {
        handleRemainLikePatchNode(lastVnode, vnode, PATCH_ACTION_REMAIN, currentPath, cnode, patch, toInitialize, toRemain, nextTransferKeyedVnodes)
      }
      lastVnodesIndex += 1
      vnodesIndex += 1
    } else {
      // different key, then we just jump to next lastVnode, waiting for a match.
      handleToMovePatchNode(lastVnode, patch)
      lastVnodesIndex += 1
    }
  }

  return {
    toInitialize,
    toRemain,
    patch,
  }
}

/**
 * The entry point of diffing the last patch(return value) and the new return value.
 * @param lastVnodesOrPatch
 * @param vnodes
 * @param parentPath
 * @param cnode
 * @param nextTransferKeyedVnodes
 * @returns {{toInitialize: {}, toRemain: {}, toDestroy: {}, patch: Array, toDestroyPatch: {}}}
 */
function diff(lastVnodesOrPatch, vnodes, parentPath, cnode, nextTransferKeyedVnodes) {
  const lastNext = { ...cnode.next }
  const toInitialize = {}
  const toRemain = {}
  const lastVnodes = lastVnodesOrPatch.filter(lastVnode => lastVnode.action === undefined || lastVnode.action.type !== PATCH_ACTION_MOVE_FROM)

  const result = createPatch(lastVnodes, vnodes, parentPath, cnode, nextTransferKeyedVnodes)
  Object.assign(toInitialize, result.toInitialize)
  Object.assign(toRemain, result.toRemain)
  each(toRemain, (_, key) => {
    delete lastNext[key]
  })

  const lastToDestroyPatch = cnode.toDestroyPatch || {}
  // CAUTION Maybe last patch have not been consumed, so we need to keep its info.
  const toDestroyPatch = { ...lastNext, ...lastToDestroyPatch }

  return { toInitialize, toRemain, toDestroy: lastNext, patch: result.patch, toDestroyPatch }
}


/**
 * The entry point of updating a rendered cnode.
 * @param cnode
 * @param renderer
 * @returns {{}}
 */
function update(cnode, renderer) {
  const render = renderer.updateRender
  const lastPatch = cnode.patch || cnode.ret
  const { transferKeyedVnodes, ret } = prepareRetForAttach(render(cnode, cnode.parent), cnode)
  const diffResult = diff(lastPatch, ret, [], cnode, transferKeyedVnodes)
  cnode.ret = ret

  cnode.patch = diffResult.patch
  // CAUTION, 这里不能用从 nextForAttach，因为上面没有 patch 等新信息，必须从 diffResult 取。
  cnode.next = { ...diffResult.toInitialize, ...diffResult.toRemain }
  cnode.transferKeyedVnodes = transferKeyedVnodes

  // toDestroyPatch indicate which cnode no more exist.
  cnode.toDestroyPatch = diffResult.toDestroyPatch
  return diffResult
}

/* *****************************
 * Diff Algorithm Functions Ends
 ***************************** */

/**
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
