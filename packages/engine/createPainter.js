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
import {
  walkVnodes,
  isComponentVnode as defaultIsComponentVnode,
  getVnodeType,
  makeVnodeKey,
} from './common'
import {
  each,
  indexBy,
  ensureArray,
  createUniqueIdGenerator,
  shallowEqual,
  invariant,
  warn
} from './util'
import {
  PATCH_ACTION_INSERT,
  PATCH_ACTION_MOVE_FROM,
  PATCH_ACTION_REMAIN,
  PATCH_ACTION_REMOVE,
  PATCH_ACTION_TO_MOVE,
  DEV_MAX_LOOP,
} from './constant'
import { defaultNormalizeLeaf, shallowCloneElement } from './createElement'

/**
 * Diff the detail of two non-component vnode.
 */
function defaultDiffNodeDetail(lastVnode, vnode) {
  if (lastVnode.type === String && lastVnode.value !== vnode.value) {
    return {
      value: vnode.value,
    }
  }

  if (!shallowEqual(lastVnode.attributes, vnode.attributes)) {
    return {
      attributes: vnode.attributes,
    }
  }
}


function DefaultComponentNode() {

}


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
function prepareRetForAttach(rawRet, cnode, { isComponentVnode, createCnode, normalizeLeaf}) {
  // user may render single component or null, we should normalize it.
  const ret = ensureArray(rawRet).map(rawVnode => normalizeLeaf(rawVnode))
  const next = {}
  const refs = {}
  const transferKeyedVnodes = {}
  // 注意，我们不会深入到传给 children 组件的 children 中去。
  walkVnodes(ret, (vnode, uniquePathStr) => {
    // 在当前 children 中的唯一值，如果用户没有指定，那么就用当前的 index
    vnode.key = uniquePathStr
    // CAUTION if transferKey is undefined， then `makeVnodeTransferKey` will return undefined
    vnode.transferKey = vnode.rawTransferKey === undefined ? undefined : `${getVnodeType(vnode)}@${vnode.rawTransferKey}`

    // 在整个组件中的唯一值。之后会传到到所有 patchNode 作为标记，这样就能通过 vnode 查找 patchNode 了。
    vnode.id = vnode.transferKey || vnode.key

    if (isComponentVnode(vnode)) {
      // CAUTION cnode has object reference inside: props/children/parent
      next[vnode.id] = createCnode(vnode, cnode)
      // CAUTION 这里有双向链接，是用来给 context 之类的功能用的
      next[vnode.id].parent = cnode

      if (vnode.transferKey !== undefined) {
        transferKeyedVnodes[vnode.transferKey] = vnode
      }

      return true
    } else if (vnode.ref) {
      // 不是 component，但是有 ref 标记也要记录
      refs[vnode.id] = vnode
    }
  })

  return { next, ret, transferKeyedVnodes, refs }
}

/**
 * The actual entry point to handle new cnode.
 *
 * @param cnode
 * @param renderer The collection of render method invoker, passed in by controller,
 * expected to return the render result which is a array of vnode.
 * Controller may inject extra arguments into render.
 * @param utils
 * @returns {{ toInitialize: Object }} The child cnodes to initialize.
 */
function paint(cnode, renderer, utils) {
  const specificRenderer = cnode.parent === undefined ? renderer.rootRender : renderer.initialRender
  const { next, ret, transferKeyedVnodes, refs } = prepareRetForAttach(specificRenderer(cnode, cnode.parent), cnode, utils)
  cnode.ret = ret
  cnode.next = next
  cnode.refs = refs
  cnode.transferKeyedVnodes = transferKeyedVnodes
  cnode.isPainted = true

  return { toInitialize: next, newRefs: refs }
}

/* *******************************
 * Diff Algorithm Functions Begins
 ****************************** */


/**
 * Patch(PatchNode) is a vnode style object, with a additional key `action`.
 * The action type indicates that the new vnode should be insert/remain/remove
 * from the parent vnode.
 */
function createPatchNode(lastVnode = {}, vnode, actionType) {
  const patch = shallowCloneElement(lastVnode)
  Object.assign(patch, {
    ...vnode,
    action: {
      type: actionType,
    },
  })

  // CAUTION 这里断开了 children，防止误操作
  // 注意一定要有判断，因为 string 等叶子节点是没有 children，这会是一个判断依据。
  if (patch.children) patch.children = []

  return patch
}

/**
 * Handle new vnode. A new vnode is a vnode with key(transferKey) that do not exist in last render result.
 * This method was used to create patchNode for new vnode, and recursively find cnode in its descendants.
 */
function handleInsertPatchNode(vnode, collections, parentPatch, cnode, utils) {
  const { isComponentVnode, createCnode } = utils
  const { toInitialize, toRemain, newRefs } = collections
  const patchNode = createPatchNode({}, vnode, PATCH_ACTION_INSERT, cnode)
  parentPatch.push(patchNode)

  // component 节点
  if (isComponentVnode(vnode)) {
    // Because current vnode is a new vnode,
    // so its child vnode patch action will have "remain" type only if it has a transferKey
    if (vnode.transferKey !== undefined && cnode.next[vnode.id] !== undefined) {
      invariant(vnode.portalRoot === undefined, `portal vnode ${vnode.name} cannot use transferKey`)
      toRemain[vnode.id] = cnode.next[vnode.id]
      if (vnode.transferKey !== undefined) {
        vnode.action = { type: PATCH_ACTION_MOVE_FROM }
      }
    } else {
      toInitialize[vnode.id] = createCnode(vnode, cnode)
    }

  } else if (vnode.children !== undefined) {
    // TODO 普通节点不允许用 transfer 吗？
    if (vnode.ref) newRefs[vnode.id] = patchNode
    // 普通节点，先记录一下 ref。这里通过 children 排除的是文字等叶子节点。
    vnode.children.forEach(childVnode => {
      handleInsertPatchNode(childVnode, collections, patchNode.children, cnode, utils)
    })

  } else {
    // 只有文字等叶子节点没有 children。他们是跟着父节点一起处理的，所以这里过滤了
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
function handleRemainLikePatchNode(lastVnode = {}, vnode, actionType, cnode, collections, parentPatch, nextTransferKeyedVnodes, utils) {
  const { toInitialize, toRemain, remainedRefs, newRefs } = collections
  const {isComponentVnode, diffNodeDetail} = utils
  const patchNode = createPatchNode(lastVnode, vnode, actionType, cnode)

  if (isComponentVnode(vnode)) {
    toRemain[vnode.id] = cnode.next[vnode.id]
    // update Props
    updateCnodeByVnode(cnode.next[vnode.id], vnode)
  } else {
    // 如果是普通节点，对比 attribute 的变化，之后 digest 的时候对 element 进行更新。
    patchNode.diff = diffNodeDetail(lastVnode, vnode)
    // children === undefined 是纯文字等叶子结点，肯定也不会有 ref ，不用考虑
    if (vnode.children !== undefined) {
      if (vnode.ref) {
        if (lastVnode.ref === vnode.ref) {
          remainedRefs[vnode.id] = patchNode
        } else {
          newRefs[vnode.id] = patchNode
        }
      }
      // 继续递归 diff
      /* eslint-disable no-use-before-define */
      const childDiffResult = diff(lastVnode.children, vnode.children, cnode, nextTransferKeyedVnodes, utils)
      /* eslint-enable no-use-before-define */
      Object.assign(toInitialize, childDiffResult.toInitialize)
      Object.assign(toRemain, childDiffResult.toRemain)
      Object.assign(newRefs, childDiffResult.newRefs)
      Object.assign(remainedRefs, childDiffResult.remainedRefs)
      patchNode.children = childDiffResult.patch
    }
  }
  parentPatch.push(patchNode)
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
function createPatch(lastVnodes, nextVnodes, cnode, nextTransferKeyedVnodes, utils) {
  const { isComponentVnode } = utils
  const collections = {
    toRemain: {},
    toInitialize: {},
    newRefs: {},
    remainedRefs: {},
    patch: []
  }
  const patch = collections.patch

  const lastVnodesLen = lastVnodes.length
  const vnodesLen = nextVnodes.length
  let lastVnodesIndex = 0
  let vnodesIndex = 0
  const lastVnodeKeys = lastVnodes.map(v => v.key)
  const lastVnodesIndexedByKey = indexBy(lastVnodes, 'key')
  const vnodeKeys = nextVnodes.map(v => v.key)

  let counter = 0

  // Use a loop to compare last vnodes and current vnodes one by one.
  while (vnodesIndex < vnodesLen || lastVnodesIndex < lastVnodesLen) {
    counter += 1
    if (counter === DEV_MAX_LOOP) { throw new Error(`patch loop over ${DEV_MAX_LOOP} times.`) }

    invariant(!((vnodesIndex in nextVnodes) && nextVnodes[vnodesIndex] === undefined), 'use null instead of undefined to represent empty node')

    const lastVnode = lastVnodes[lastVnodesIndex]
    const vnode = nextVnodes[vnodesIndex]

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
        handleRemainLikePatchNode(lastVnode, vnode, PATCH_ACTION_REMAIN, cnode, collections, patch, nextTransferKeyedVnodes, utils)
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
        handleInsertPatchNode(vnode, collections, patch, cnode, utils)
      } else {
        // If it is not new, it must be transferred from somewhere. Mark it as `moveFrom`
        handleRemainLikePatchNode(cnode.transferKeyedVnodes[vnode.transferKey], vnode, PATCH_ACTION_MOVE_FROM, cnode, collections, patch, nextTransferKeyedVnodes, utils)
      }

      // jump the condition of `lastVnode === vnode`, because we dealt with it before
      vnodesIndex += 1
      continue
    }

    // All conditions of transferKey have been handled, now we handle normal key diff.
    // Handle boundary conditions first.
    // 1) vnodes runs out.
    if (!(vnodesIndex < vnodesLen)) {
      // If action.type is  PATCH_ACTION_INSERT, that means this node is not digested yet.
      // Because all inserted node action type will be changed to  PATCH_ACTION_REMAIN after digestion.
      if (lastVnode.action === undefined || lastVnode.action.type !== PATCH_ACTION_INSERT) {
        handleRemovePatchNode(lastVnode, patch)
      }
      lastVnodesIndex += 1
      continue
    }

    // 2) lastVnodes runs out.
    if (!(lastVnodesIndex < lastVnodesLen)) {
      const correspondingLastVnode = lastVnodesIndexedByKey[vnode.key]
      if (correspondingLastVnode !== undefined && correspondingLastVnode.type === vnode.type) {
        handleRemainLikePatchNode(correspondingLastVnode, vnode, PATCH_ACTION_MOVE_FROM, cnode, collections, patch, nextTransferKeyedVnodes, utils)
      } else {
        handleInsertPatchNode(vnode, collections, patch, cnode, utils)
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
    if (!vnodeKeys.includes(lastVnode.key)) {
      handleRemovePatchNode(lastVnode, patch)
      lastVnodesIndex += 1
      continue
    }

    // If current vnode is new.
    if (!lastVnodeKeys.includes(vnode.key)) {
      handleInsertPatchNode(vnode, collections, patch, cnode, utils)
      vnodesIndex += 1
      continue
    }

    // If lastVnode and vnode has the same key.
    if (vnode.key === lastVnode.key) {
      // 1) different type, then we remove the old, insert the new.
      if (vnode.type !== lastVnode.type) {
        handleRemovePatchNode(lastVnode, patch)
        handleInsertPatchNode(vnode, collections, patch, cnode, utils)
        // 2) same type
      } else {
        handleRemainLikePatchNode(lastVnode, vnode, PATCH_ACTION_REMAIN, cnode, collections, patch, nextTransferKeyedVnodes, utils)
      }
      lastVnodesIndex += 1
      vnodesIndex += 1
    } else {
      // different key, then we just jump to next lastVnode, waiting for a match.
      handleToMovePatchNode(lastVnode, patch)
      lastVnodesIndex += 1
    }
  }

  return collections
}

/**
 * The entry point of diffing the last patch and the new return value.
 */
function diff(lastVnodesOrPatch, nextVnodes, cnode, nextTransferKeyedVnodes, utils) {
  const lastNext = { ...cnode.next }
  const lastRefs = { ...cnode.refs }
  const toInitialize = {}
  const toRemain = {}
  const toDestroy = {}
  const newRefs = {}
  const remainedRefs = {}
  const disposedRefs = {}

  const lastVnodes = lastVnodesOrPatch.filter(lastVnode => lastVnode.action === undefined || lastVnode.action.type !== PATCH_ACTION_MOVE_FROM)

  const result = createPatch(lastVnodes, nextVnodes, cnode, nextTransferKeyedVnodes, utils)
  Object.assign(toInitialize, result.toInitialize)
  Object.assign(toRemain, result.toRemain)
  each(lastNext, (value, key) => {
    if (!toRemain[key]) toDestroy[key] = value
  })

  Object.assign(newRefs, result.newRefs)
  Object.assign(remainedRefs, result.remainedRefs)
  each(lastRefs, (value, key) => {
    if (!remainedRefs[key]) disposedRefs[key] = value
  })

  // CAUTION Maybe last patch have not been consumed, so we need to keep its info.
  // `lastToDestroyPatch` contains the real dom reference to remove.
  const lastToDestroyPatch = cnode.toDestroyPatch || {}
  const toDestroyPatch = { ...toDestroy, ...lastToDestroyPatch }

  return {
    toInitialize,
    toRemain,
    toDestroy,
    toDestroyPatch,
    // ref 相关
    newRefs,
    remainedRefs,
    disposedRefs,
    // patch
    patch: result.patch,
  }
}


/**
 * The entry point of updating a rendered cnode.
 */
function repaint(cnode, renderer, utils) {
  const render = renderer.updateRender
  const lastPatch = cnode.patch || cnode.ret
  const renderResult = render(cnode, cnode.parent)
  // return false to suspense update
  if (renderResult === false) return {}

  const { transferKeyedVnodes, ret } = prepareRetForAttach(renderResult, cnode, utils)
  const diffResult = diff(lastPatch, ret, cnode, transferKeyedVnodes, utils)
  cnode.ret = ret

  cnode.patch = diffResult.patch

  cnode.next = { ...diffResult.toInitialize, ...diffResult.toRemain }
  // TODO 为什么要记录 transferKeyedVnodes？
  cnode.transferKeyedVnodes = transferKeyedVnodes

  // TODO 为什么要记录？
  // `toDestroyPatch` indicate which cnode no more exist.
  cnode.toDestroyPatch = diffResult.toDestroyPatch
  return diffResult
}

/* *****************************
 * Diff Algorithm Functions Ends
 ***************************** */

/**
 * 使用说明
 * 1. 创建 painter。需要传入一个 renderer({ rootRender: function, initialRender: function})。rootRender
 * 用来渲染根组件，剩下的用 initialRender。传入 isComponentVnode 可以判断是否是 component 组件。
 *
 * paint:
 * 首次对 cnode(component node) 进行渲染。注意只对当前的 cnode 节点执行 render。
 * 执行完之后，会在 cnode 上存上:
 * {
 *   ret: render 执行完的结果
 *   next: kv 值，表示有哪些子组件
 *   transferKeyedVnodes: transfer vnode 的标记。
 * }
 *
 * repaint:
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
 *
 */
export default function createPainter(renderer, isComponentVnode = defaultIsComponentVnode, ComponentNode = DefaultComponentNode, diffNodeDetail = defaultDiffNodeDetail, normalizeLeaf = defaultNormalizeLeaf) {

  const generateCnodeId = createUniqueIdGenerator('com')

  function createCnode(vnode, parent) {
    const cnode = new ComponentNode(vnode.type)

    warn(!(vnode.ref  && !vnode.type.forwardRef), `${vnode.type.displayName || vnode.type.name } do not accept ref, but you passed ref prop to it.`)
    Object.assign(cnode, {
      type: vnode.type,
      displayName: vnode.type.displayName || vnode.type.name,
      props: vnode.attributes || {},
      level: parent ? parent.level + 1 : 0,
      // 对 cnode 也可以打 ref。跟 react 一样，这里记录一下，会作为 render 第二参数传入。
      ref: ComponentNode.forwardRef ? vnode.ref :vnode.ref,
      parent,
      id: generateCnodeId()
    })

    cnode.props.children = vnode.children
    if (vnode.type.forwardRef) cnode.props.ref = vnode.ref
    return cnode
  }

  const utils = {
    isComponentVnode,
    createCnode,
    diffNodeDetail,
    normalizeLeaf
  }

  return {
    paint: (cnode) => {
      if (cnode.isPainted) throw new Error(`cnode already painted ${cnode.type.displayName}`)
      return paint(cnode, renderer, utils)
    },
    repaint: (cnode) => {
      if (!cnode.isPainted) throw new Error(`cnode is not painted ${cnode.type.displayName}`)
      return repaint(cnode, renderer, utils)
    },
    handle: (cnode) => {
      return cnode.ret === undefined ? paint(cnode, renderer, utils) : repaint(cnode, renderer, utils)
    },
    createCnode,
  }
}
