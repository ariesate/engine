import {
  createVnodePath,
  vnodePathToString,
  resolveFirstLayerElements,
} from '../common'
import {
  PATCH_ACTION_MOVE_FROM,
} from '../constant'
import { handleMoveFromPatchNode } from './updateDigest'
import {isObject, invariant} from '../util'
import Fragment from '../Fragment'
import VNode from '../VNode'

/**
 * Attach element reference to cnode.
 */
function prepareCnodeForView(cnode, vnode, parentNode, viewUtil) {
  // 但 cnode 是根节点时就没有对应的 vnode。
  const placeHolderText = vnode ? vnode.key: 'root'
  const startPlaceholder = viewUtil.createPlaceholder(`start: ${placeHolderText}`)
  const endPlaceholder = viewUtil.createPlaceholder(`end: ${placeHolderText}`)
  parentNode.appendChild(startPlaceholder)
  parentNode.appendChild(endPlaceholder)
  if (parentNode._childCnodes === undefined) parentNode._childCnodes = []
  parentNode._childCnodes.push(cnode)
  cnode.view = {
    // 用来便于快速根据 id 查找 patch 中的 patchNode。做局部跟新的时候用来节约性能。
    // 需要 initialDigest/updateDigest 中手动维护。
    patchNodesQuickRefById: {},
    getElementByPatchNode(p) {
      return cnode.view.patchNodesQuickRefById[p.id].element
    },
    startPlaceholder,
    endPlaceholder,
    // 这是用来获取 cnode 自己的第一层 elements。
    getRootElements() {
      return resolveFirstLayerElements(cnode.patch, cnode)
    },
  }
}

/**
 * dom ref is handled by View in view.createElement.
 */
function handleInitialNaiveVnode(vnode, cnode, viewUtil, patch, parentNode) {
  const element = viewUtil.createElement(vnode, cnode, patch)
  parentNode.appendChild(element)
  // Save it for update
  patch.element = element

  if (vnode.children !== undefined) {
    patch.children = []
    /* eslint-disable no-use-before-define */
    handleInitialVnodeChildren(vnode.children, cnode, viewUtil, patch.children, element)
    /* eslint-enable no-use-before-define */
  }
}

export function handleInitialVnode(vnode, cnode, viewUtil, parentPatch, parentNode, index) {
  const patch = viewUtil.shallowCloneElement(vnode)
  parentPatch[index] = patch
  // 之后用来快速查找 patch
  cnode.view.patchNodesQuickRefById[patch.id] = patch

  // vnode types:
  // 1) string/null。undefined 改成了 type: String, value: 'undefined'

  if (vnode.type === null) return
  // pure string vnode, no refs
  if (vnode.type === String) {
    const element = viewUtil.createElement(vnode, cnode, patch)
    patch.element = element
    return parentNode.appendChild(element)
  }

  // CAUTION we do not flatten array, because React do not too.
  // There will be a empty element in path, it is ok.
  if (vnode.type === Fragment || vnode.type === Array) {
    /* eslint-disable no-use-before-define */
    return handleInitialVnodeChildren(vnode.children, cnode, viewUtil, patch.children, parentNode)
    /* eslint-enable no-use-before-define */
  }

  // vnode/component vnode 可以使用 createPortal 渲染到别的节点下
  // 2) normal node
  if (vnode instanceof VNode && !viewUtil.isComponentVnode(vnode)) {
    return handleInitialNaiveVnode(vnode, cnode, viewUtil, patch,vnode.portalRoot || parentNode)
  }
  // 3) component node
  if (viewUtil.isComponentVnode(vnode)) {
    /* eslint-disable no-use-before-define */
    return handleInitialComponentNode(vnode, cnode, viewUtil, patch,vnode.portalRoot || parentNode)
    /* eslint-enable no-use-before-define */
  }

  // 4) 没有被组件处理掉的 object/function。

  if (isObject(vnode)|| typeof vnode === 'function') {
    const stringLikeResult = viewUtil.digestObjectLike(vnode)
    if (stringLikeResult && stringLikeResult.type === String) {
      const element = viewUtil.createElement(stringLikeResult, cnode, patch)
      patch.element = element
      return parentNode.appendChild(element)
    }
  }

  throw new Error(`unknown vnode detected: ${(vnode ? `type: ${vnode.type || typeof vnode}, name: ${vnode.name}, key: ${vnode.key}` : 'undefined')}`)
}

function handleInitialVnodeChildren(vnodes, cnode, viewUtil, patch, parentNode) {
  // vnodes conditions:
  // 1) vnode children
  // 2) vnode of array type
  // TODO 同类型、同key或者同没 key 的检测。
  vnodes.forEach((vnode, index) => {
    if (vnode.action && vnode.action.type === PATCH_ACTION_MOVE_FROM) {
      handleMoveFromPatchNode(vnode, patch, cnode, parentNode, viewUtil)
    } else {
      handleInitialVnode(vnode, cnode, viewUtil, patch, parentNode, index)
    }
  })
}

function handleInitialComponentNode(vnode, cnode, viewUtil, patch, parentNode) {
  const childCnode = cnode.next[vnode.id]
  childCnode.patch = []
  prepareCnodeForView(childCnode, vnode, parentNode, viewUtil)

  patch.element = vnode.id
}

/**
 * digest 完一个 cnode:
 * 在 cnode 上附加上 viewUtil，viewUtil 上有 ref 信息。
 * 在 cnode.patch 上附加 element，之后的 diff 都是跟上一次的 patch diff。
 *
 * viewUtil: {
 *   createFragment,
 *   createElement
 * }
 */


// initialDigest handle the whole tree
export default function initialDigest(cnode, viewUtil) {
  invariant(!cnode.isDigested, 'cnode is digested, please use updateDigest.')
  // 根节点，要提前 prepare 一下。非根节点后面 handle 的时候会 prepare。
  // 对于组件里面再嵌套的组件，我们也只是 prepare 一下，不继续递归，渲染。
  if (cnode.parent === undefined) prepareCnodeForView(cnode, null, viewUtil.getRoot(), viewUtil)
  if (cnode.view.startPlaceholder === undefined) throw new Error(`cnode is not prepared for initial digest ${cnode.type.displayName}`)
  cnode.patch = []
  const fragment = viewUtil.createFragment()
  handleInitialVnodeChildren(cnode.ret, cnode, viewUtil, cnode.patch, fragment)
  const parentNode = cnode.view.startPlaceholder.parentNode
  parentNode.insertBefore(fragment, cnode.view.startPlaceholder.nextSibling)
  // 还是留着 startPlaceholder。直到 remove 的时候
  // parentNode.removeChild(cnode.view.startPlaceholder)
  // delete cnode.viewUtil.startPlaceholder
  cnode.view.parentNode = parentNode
  cnode.isDigested = true
}

