import {
  createVnodePath,
  vnodePathToString,
  isComponentVnode,
  cloneVnode,
  resolveFirstLayerElements,
} from '../common'
import {
  PATCH_ACTION_MOVE_FROM,
} from '../constant'
import { handleMoveFromPatchNode } from './updateDigest'
import { mapValues } from '../util'

/**
 * Attach element reference to cnode.
 */
function attachCnodeView(cnode, parentNode) {
  cnode.view = {
    rootRefs: [],
    refs: {},
    parentNode,
    getRefs() {
      return mapValues(cnode.view.refs, (ref) => {
        if (typeof ref === 'string') {
          const nextCnode = cnode.next[ref]
          return resolveFirstLayerElements(nextCnode.patch, [], nextCnode)
        }
        return ref
      })
    },
    getViewRefs() {
      return resolveFirstLayerElements(cnode.patch, [], cnode)
    },
  }
}

/**
 * If the third argument is a string, that mean it is a cnode ref.
 * We need to look up child cnodes to find the reference.
 */
function attachCnodeViewQuickRefs(cnode, vnode, element) {
  if (vnode.ref !== undefined) {
    cnode.view.refs[vnode.ref] = element
  }
}

function handleInitialNaiveVnode(vnode, cnode, view, vnodeRef, currentPath, parentNode) {
  const { createElement } = view

  const element = createElement(vnode)
  parentNode.appendChild(element)
  // Save it for update
  vnodeRef.element = element

  // Save references of root vnode and vnode with `ref` attribute
  attachCnodeViewQuickRefs(cnode, vnode, element)

  if (vnode.children !== undefined) {
    vnodeRef.children = []
    /* eslint-disable no-use-before-define */
    handleInitialVnodeChildren(vnode.children, cnode, view, vnodeRef.children, currentPath, element)
    /* eslint-enable no-use-before-define */
  }
}


function handleInitialComponentNode(vnode, cnode, view, vnodeRef, currentPath, parentNode, cnodesToUpdateParentNode) {
  const currentPathStr = vnodePathToString(currentPath)
  const nextIndex = vnode.transferKey === undefined ? currentPathStr : vnode.transferKey
  const childCnode = cnode.next[nextIndex]
  attachCnodeView(childCnode, parentNode)
  attachCnodeViewQuickRefs(cnode, vnode, nextIndex)

  vnodeRef.element = nextIndex

  const fragment = view.createFragment()

  /* eslint-disable no-use-before-define */
  const retRefs = []
  handleInitialVnodeChildren(childCnode.ret, childCnode, view, retRefs, [], fragment)
  /* eslint-enable no-use-before-define */
  childCnode.patch = retRefs
  parentNode.appendChild(fragment)

  if (cnodesToUpdateParentNode) cnodesToUpdateParentNode.push(childCnode)

  view.collectInitialDigestedCnode(childCnode)
}

export function handleInitialVnode(vnode, cnode, view, vnodesRef, parentPath, parentNode, index, cnodesToUpdateParentNode) {
  const vnodeRef = cloneVnode(vnode)
  vnodesRef[index] = vnodeRef

  const currentPath = createVnodePath(vnode, parentPath)
  // vnode types:
  // 1) text/string/null
  if (vnode.type === null) return
  if (vnode.type === String) {
    const element = view.createElement(vnode)
    vnodeRef.element = element
    return parentNode.appendChild(element)
  }

  // CAUTION we do not flatten array, because React do not too.
  // There will be a empty element in path, it is ok.
  if (vnode.type === Array) {
    /* eslint-disable no-use-before-define */
    return handleInitialVnodeChildren(vnode.children, cnode, view, vnodeRef.children, currentPath, parentNode, cnodesToUpdateParentNode)
    /* eslint-enable no-use-before-define */
  }

  // 2) normal node
  if (!isComponentVnode(vnode)) {
    return handleInitialNaiveVnode(vnode, cnode, view, vnodeRef, currentPath, parentNode)
  }

  // 3) component node
  if (isComponentVnode(vnode)) {
    return handleInitialComponentNode(vnode, cnode, view, vnodeRef, currentPath, parentNode, cnodesToUpdateParentNode)
  }
}

function handleInitialVnodeChildren(vnodes, cnode, view, vnodesRef, parentPath, parentNode, cnodesToUpdateParentNode) {
  // vnodes conditions:
  // 1) vnode children
  // 2) vnode of array type
  vnodes.forEach((vnode, index) => {
    if (vnode.action && vnode.action.type === PATCH_ACTION_MOVE_FROM) {
      handleMoveFromPatchNode(vnode, vnodesRef, parentPath, cnode, parentNode, view, cnodesToUpdateParentNode)
    } else {
      handleInitialVnode(vnode, cnode, view, vnodesRef, parentPath, parentNode, index, cnodesToUpdateParentNode)
    }
  })
}

// initialDigest handle the whole tree
export default function initialDigest(ctree, view) {
  const parentNode = view.getRoot()
  attachCnodeView(ctree, parentNode)
  const fragment = view.createFragment()
  const retRefs = []
  const cnodesToUpdateParentNode = []
  handleInitialVnodeChildren(ctree.ret, ctree, view, retRefs, [], fragment, cnodesToUpdateParentNode)
  // CAUTION replaced ret with retRefs for update.
  ctree.patch = retRefs
  cnodesToUpdateParentNode.forEach(cnode => cnode.view.parentNode = parentNode)

  parentNode.appendChild(fragment)
  view.collectInitialDigestedCnode(ctree)
}
