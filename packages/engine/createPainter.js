/**
 * Variable Name Convention
 * cnode: Component tree node. See function `createCnode` from attributes.
 * ret: The return value of render method. It is always a array of vnode.
 * patch: Vnode diff result, it tells view how to handle real dom.
 *
 * Painter handles the actual cnode painting work.
 * It only paint one cnode at a time. For recursive painting,
 * it needs a scheduler to call its handle method from outside.
 *
 * The painting result consists of two parts:
 * 1) patch: vnode diff result.
 * 2) next: child cnodes.
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
  createVnodePath,
  makeVnodeKey,
  getVnodeNextIndex,
  walkVnodes,
  isComponentVnode as defaultIsComponentVnode,
} from './common'
import { each, indexBy, ensureArray, createUniqueIdGenerator } from './util'
import {
  PATCH_ACTION_INSERT,
  PATCH_ACTION_MOVE_FROM,
  PATCH_ACTION_REMAIN,
  PATCH_ACTION_REMOVE,
  PATCH_ACTION_TO_MOVE,
  DEV_MAX_LOOP,
} from './constant'
import { normalizeChildren } from './createElement'
import VNode from './VNode';


export function updateCnodeByVnode(cnode, vnode) {
  if (cnode.type !== vnode.type) throw new Error('Can not update a cnode to different type')
  cnode.lastProps = cnode.props
  cnode.props = vnode.attributes || {}
  cnode.props.children = vnode.children
}

/**
 *  Generate 3 elemental parts for diff algorithm to use.
 *  1) Normalized return value of render method,
 *  with key attached to **every** vnode, so diff algorithm can be simpler.
 *   2. Calculated child cnodes, returned as `next`.
 *   3. Vnodes with transfer key.
 */
function prepareRetForAttach(rawRet, cnode, isComponentVnode, createCnode) {
  // user may render single component or null, we should normalize it.
  const ret = normalizeChildren(ensureArray(rawRet))
  const next = {}
  const transferKeyedVnodes = {}
  walkRawVnodes(ret, (vnode, path, parentVnodePath = []) => {
    vnode.key = makeVnodeKey(vnode, path[path.length - 1])
    // CAUTION if transferKey is undefined， then `makeVnodeTransferKey` will return undefined
    vnode.transferKey = makeVnodeTransferKey(vnode)
    if (isComponentVnode(vnode)) {
      const nextIndex = getVnodeNextIndex(vnode, parentVnodePath)
      // CAUTION cnode has object reference inside: props/children/parent
      next[nextIndex] = createCnode(vnode, cnode)
      if (vnode.transferKey !== undefined) {
        transferKeyedVnodes[vnode.transferKey] = vnode
      }
      // TODO 研究这个 feature, 如果组件没有指明 transparent，那么就不穿透。穿透的场景是什么？
      if (!vnode.transparent) {
        return false
      }
    }

    return parentVnodePath.concat(vnode.key)
  })

  return { next, ret, transferKeyedVnodes }
}

/**
 * The actual entry point to handle new cnode.
 *
 * @param cnode
 * @param renderer The collection of render method invoker, passed in by controller,
 * expected to return the render result which is a array of vnode.
 * Controller may inject extra arguments into render.
 * @returns {{ toInitialize: Object }} The child cnodes to initialize.
 */
function paint(cnode, renderer, isComponentVnode, createCnode) {
  const specificRenderer = cnode.parent === undefined ? renderer.rootRender : renderer.initialRender
  const { next, ret, transferKeyedVnodes } = prepareRetForAttach(specificRenderer(cnode, cnode.parent), cnode, isComponentVnode, createCnode)

  cnode.ret = ret
  cnode.next = next
  cnode.transferKeyedVnodes = transferKeyedVnodes
  cnode.isPainted = true

  return { toInitialize: next }
}

/* *******************************
 * Diff Algorithm Functions Begins
 ****************************** */

/**
 * Diff the detail of two vnode.
 */
function diffNodeDetail(lastVnode, vnode) {
  if (lastVnode.type === String && lastVnode.value !== vnode.value) {
    return {
      value: vnode.value,
    }
  }

  // TODO Improve performance. Maybe only style rules changed.
  if (!deepEqual(lastVnode.attributes, vnode.attributes)) {
    return {
      attributes: vnode.attributes,
    }
  }
}

/**
 * Patch(PatchNode) is a vnode style object, with a additional key `action`.
 * The action type indicates that the new vnode should be insert/remain/remove
 * from the parent vnode.
 */
function createPatchNode(lastVnode = {}, vnode, actionType) {
  const patch = new VNode()
  Object.assign(patch, {
    ...lastVnode,
    ...vnode,
    action: {
      type: actionType,
    },
  })
  return patch
}

/**
 * Handle new vnode. A new vnode is a vnode with key(transferKey) that do not exist in last render result.
 * This method was used to create patchNode for new vnode, and recursively find cnode in its descendants.
 */
function handleInsertPatchNode(vnode, currentPath, patch, toInitialize, toRemain, cnode, isComponentVnode, createCnode) {
  patch.push(createPatchNode({}, vnode, PATCH_ACTION_INSERT))
  if (isComponentVnode(vnode)) {
    const nextIndex = vnode.transferKey === undefined ? vnodePathToString(currentPath) : vnode.transferKey
    toInitialize[nextIndex] = createCnode(vnode, cnode)
  } else if (vnode.children !== undefined) {
    walkVnodes(vnode.children, (childVnode, vnodePath) => {
      if (isComponentVnode(childVnode)) {
        const nextIndex = childVnode.transferKey === undefined ? vnodePathToString(currentPath.concat(vnodePath)) : childVnode.transferKey

        // Because current vnode is a new vnode,
        // so its child vnode patch action will have "remain" type only if it has a transferKey
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
 * If a vnode's position changed from last time, we use this method to mark it.
 */
function handleToMovePatchNode(lastVnode, patch) {
  patch.push(createPatchNode(lastVnode, {}, PATCH_ACTION_TO_MOVE))
}

/**
 * If a vnode remains the same position, we use this method to (recursively) handle its children.
 */
function handleRemainLikePatchNode(lastVnode = {}, vnode, actionType, currentPath, cnode, patch, toInitialize, toRemain, nextTransferKeyedVnodes, isComponentVnode, createCnode) {
  const patchNode = createPatchNode(lastVnode, vnode, actionType)

  if (isComponentVnode(vnode)) {
    const path = vnodePathToString(currentPath)
    toRemain[path] = cnode.next[path]
    // update Props
    updateCnodeByVnode(cnode.next[path], vnode)
  } else {
    patchNode.patch = diffNodeDetail(lastVnode, vnode)
    if (vnode.children !== undefined) {
      /* eslint-disable no-use-before-define */
      const childDiffResult = diff(lastVnode.children, vnode.children, currentPath, cnode, nextTransferKeyedVnodes, isComponentVnode, createCnode)
      /* eslint-enable no-use-before-define */
      Object.assign(toInitialize, childDiffResult.toInitialize)
      Object.assign(toRemain, childDiffResult.toRemain)
      patchNode.children = childDiffResult.patch
    }
  }
  patch.push(patchNode)
}

/**
 * The entry point to create a vnode patch, and collect new child cnodes information.
 * This method is the core of diff algorithm. It used key and transferKey to track vnodes.
 * The different between key and transfer key is that, we only track key in its siblings,
 * but track transfer key in the render result.
 * Another important thing need to be illustrated is that, this method can also compare
 * last patch to current render result. In this circumstance, the returned patch represent
 * the difference between current result and the result before last patch.
 * With this feature, users can skip real dom manipulation for request like performance concern, etc..
 *
 * We only compare vnode.type & vnode.key, prop change is not in consideration.
 * If consumer need to compare props, should do it self with toRemain prop in result.
 * See Controller Axii for example.
 */
function createPatch(lastVnodes, vnodes, parentPath, cnode, nextTransferKeyedVnodes, isComponentVnode, createCnode) {
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

  // Use a loop to compare last vnodes and current vnodes one by one.
  while (vnodesIndex < vnodesLen || lastVnodesIndex < lastVnodesLen) {
    counter += 1
    if (counter === DEV_MAX_LOOP) { throw new Error(`patch loop over ${DEV_MAX_LOOP} times.`) }

    const lastVnode = lastVnodes[lastVnodesIndex]
    const vnode = vnodes[vnodesIndex]
    if (vnode === undefined) throw new Error('cannot use undefined as vnode, use null instead.')
    // Handle transferKey first. Only component vnode may have transferKey.
    if (lastVnode !== undefined &&
      isComponentVnode(lastVnode) &&
      lastVnode.transferKey !== undefined
    ) {
      // If current lastVnode transferKey not exist anymore
      if (nextTransferKeyedVnodes[lastVnode.transferKey] === undefined) {
        handleRemovePatchNode(lastVnode, patch)
        lastVnodesIndex += 1
        continue
      }
      // If it still exist and current vnode have the same type, we mark it as "remain".
      if (vnode !== undefined && vnode.type === lastVnode.type && vnode.transferKey === lastVnode.transferKey) {
        handleRemainLikePatchNode(lastVnode, vnode, PATCH_ACTION_REMAIN, [getVnodeNextIndex(vnode)], cnode, patch, toInitialize, toRemain, nextTransferKeyedVnodes, isComponentVnode, createCnode)
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
        // If it is new vnode
        handleInsertPatchNode(vnode, [getVnodeNextIndex(vnode)], patch, toInitialize, toRemain, cnode, isComponentVnode, createCnode)
      } else {
        // If it is not new, it must be transferred from somewhere. Mark it as `moveFrom`
        handleRemainLikePatchNode(cnode.transferKeyedVnodes[vnode.transferKey], vnode, PATCH_ACTION_MOVE_FROM, [getVnodeNextIndex(vnode)], cnode, patch, toInitialize, toRemain, nextTransferKeyedVnodes, isComponentVnode, createCnode)
      }

      // jump the condition of `lastVnode === vnode`, because we dealt with it before
      vnodesIndex += 1
      continue
    }

    // All conditions of transferKey have been handled, now we handle normal key diff.
    // Handle boundary conditions first.
    // 1) vnodes runs out.
    if (!(vnodesIndex < vnodesLen)) {
      if (lastVnode.action === undefined || lastVnode.action.type !== PATCH_ACTION_INSERT) {
        handleRemovePatchNode(lastVnode, patch)
      }
      lastVnodesIndex += 1
      continue
    }

    const currentPath = createVnodePath(vnode, parentPath)
    // 2) lastVnodes runs out.
    if (!(lastVnodesIndex < lastVnodesLen)) {
      const correspondingLastVnode = lastVnodesIndexedByKey[vnode.key]
      if (correspondingLastVnode !== undefined && correspondingLastVnode.type === vnode.type) {
        handleRemainLikePatchNode(correspondingLastVnode, vnode, PATCH_ACTION_MOVE_FROM, currentPath, cnode, patch, toInitialize, toRemain, nextTransferKeyedVnodes, isComponentVnode, createCnode)
      } else {
        handleInsertPatchNode(vnode, currentPath, patch, toInitialize, toRemain, cnode, isComponentVnode, createCnode)
      }

      vnodesIndex += 1
      continue
    }

    // Both lastVnode and vnode exists.
    const { action = { type: PATCH_ACTION_REMAIN } } = lastVnode
    // 1) remove + remove = remove
    if (action.type === PATCH_ACTION_REMOVE) {
      patch.push(lastVnode)
      lastVnodesIndex += 1
      continue
    }

    // Only insert/to_move/remain left now.
    // 2) If last vnode not exist anymore, we need to remove it.
    // If the lastVnode was marked as `insert`,
    // that means the real dom has not been inserted,
    // so we just skip it.
    if (!vnodeKeys.includes(lastVnode.key)) {
      if (action.type !== PATCH_ACTION_INSERT) {
        handleRemovePatchNode(lastVnode, patch)
      }
      lastVnodesIndex += 1
      continue
    }

    // If current vnode is new.
    if (!lastVnodeKeys.includes(vnode.key)) {
      handleInsertPatchNode(vnode, currentPath, patch, toInitialize, toRemain, cnode, isComponentVnode, createCnode)
      vnodesIndex += 1
      continue
    }

    // If lastVnode and vnode has the same key.
    if (vnode.key === lastVnode.key) {
      // 1) different type, then we remove the old, insert the new.
      if (vnode.type !== lastVnode.type) {
        handleRemovePatchNode(lastVnode, patch)
        handleInsertPatchNode(vnode, currentPath, patch, toInitialize, toRemain, cnode, isComponentVnode, createCnode)
        // 2) same type
      } else {
        handleRemainLikePatchNode(lastVnode, vnode, PATCH_ACTION_REMAIN, currentPath, cnode, patch, toInitialize, toRemain, nextTransferKeyedVnodes, isComponentVnode, createCnode)
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
 * The entry point of diffing the last patch and the new return value.
 */
function diff(lastVnodesOrPatch, vnodes, parentPath, cnode, nextTransferKeyedVnodes, isComponentVnode, createCnode) {
  const lastNext = { ...cnode.next }
  const toInitialize = {}
  const toRemain = {}

  const toUpdate = {}
  const lastVnodes = lastVnodesOrPatch.filter(lastVnode => lastVnode.action === undefined || lastVnode.action.type !== PATCH_ACTION_MOVE_FROM)

  const result = createPatch(lastVnodes, vnodes, parentPath, cnode, nextTransferKeyedVnodes, isComponentVnode, createCnode)
  Object.assign(toInitialize, result.toInitialize)
  Object.assign(toRemain, result.toRemain)
  each(toRemain, (_, key) => {
    delete lastNext[key]
  })

  const lastToDestroyPatch = cnode.toDestroyPatch || {}
  // CAUTION Maybe last patch have not been consumed, so we need to keep its info.
  // `lastToDestroyPatch` contains the real dom reference to remove.
  const toDestroyPatch = { ...lastNext, ...lastToDestroyPatch }

  return { toInitialize, toRemain, toDestroy: lastNext, patch: result.patch, toDestroyPatch, toUpdate }
}


/**
 * The entry point of updating a rendered cnode.
 */
function repaint(cnode, renderer, isComponentVnode, createCnode) {
  const render = renderer.updateRender
  const lastPatch = cnode.patch || cnode.ret
  const renderResult = render(cnode, cnode.parent)
  // return false to suspense update
  if (renderResult === false) return {}


  const { transferKeyedVnodes, ret } = prepareRetForAttach(renderResult, cnode, isComponentVnode, createCnode)
  const diffResult = diff(lastPatch, ret, [], cnode, transferKeyedVnodes, isComponentVnode, createCnode)
  cnode.ret = ret

  cnode.patch = diffResult.patch
  // CAUTION, 这里不能用从 nextForAttach，因为上面没有 patch 等新信息，必须从 diffResult 取。
  cnode.next = { ...diffResult.toInitialize, ...diffResult.toRemain }
  cnode.transferKeyedVnodes = transferKeyedVnodes

  // `toDestroyPatch` indicate which cnode no more exist.
  cnode.toDestroyPatch = diffResult.toDestroyPatch
  return diffResult
}

/* *****************************
 * Diff Algorithm Functions Ends
 ***************************** */

/**
 * ===使用说明
 * 1. 创建 painter。需要传入一个 renderer({ rootRender: function, initialRender: function})。rootRender
 * 用来渲染根组件，剩下的用 initialRender。传入 isComponentVnode 可以判断是否是 component 组件。
 *
 * # paint:
 * 首次对 cnode(component node) 进行渲染。注意只对当前的 cnode 节点执行 render。
 * 执行完之后，会在 cnode 上存上:
 * {
 *   ret: render 执行完的结果
 *   next: kv 值，表示有哪些子组件
 *   transferKeyedVnodes: transfer vnode 的标记。
 * }
 *
 * # repaint:
 * 第二次进行渲染，根据 render 出来的值跟上一次 cnode.ret 上的值来进行 diff，会返回 diff 结果：
 * {
 *  toInitialize: 要新建的子组件，
 *  toRemain: 不动的子组件
 *  toDestroy: 要删除的子组件
 *  patch: 一个 vnode tree 的超集，通过对比新 render vnode tree 和上次的对比，在一些节点上标记新增、删除等标记。
 *  toDestroyPatch: 这一次要删除的子组件，加上可能之前没消费掉的要删除的子组件
 * }
 *
 * 会在 cnode 上存上或者修改：
 * {
 *   patch: 要修改的 vnode tree 超集合
 *   toDestroyPatch: 要删除的部分
 *   children[修改]: 根据 vnode.children 修改 cnode.children
 * }
 *
 */
export default function createPainter(renderer, isComponentVnode = defaultIsComponentVnode, ComponentNode) {

  const generateCnodeId = createUniqueIdGenerator('com')

  function createCnode(vnode, parent) {
    const cnode = ComponentNode ? new ComponentNode() : {}
    Object.assign(cnode, {
      type: vnode.type,
      props: vnode.attributes || {},
      level: parent ? parent.level + 1 : 0,
      ref: vnode.ref,
      parent,
      id: generateCnodeId()
    })

    cnode.props.children = vnode.children
    return cnode
  }


  return {
    paint: (cnode) => {
      if (cnode.isPainted) throw new Error(`cnode already painted ${cnode.type.displayName}`)
      return paint(cnode, renderer, isComponentVnode, createCnode)
    },
    repaint: (cnode) => {
      if (!cnode.isPainted) throw new Error(`cnode is not painted ${cnode.type.displayName}`)
      return repaint(cnode, renderer, isComponentVnode, createCnode)
    },
    handle: (cnode) => {
      return cnode.ret === undefined ? paint(cnode, renderer, isComponentVnode, createCnode) : repaint(cnode, renderer, isComponentVnode, createCnode)
    },
    createCnode,
  }
}
