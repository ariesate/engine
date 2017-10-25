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
import createElement from '../createElement'
import { handleMoveFromPatchNode } from './updateDigest'
import { mapValues } from '../util'

/**
 * Attach element reference to cnode.
 */
function prepareCnodeForView(cnode, vnode, parentNode, view) {
  const placeHolder = view.createElement(createElement('div', { style: { display: 'none' } }))
  parentNode.appendChild(placeHolder)
  if (parentNode._childCnodes === undefined) parentNode._childCnodes = []
  parentNode._childCnodes.push(cnode)
  cnode.view = {
    rootRefs: [],
    refs: {},
    vnode,
    placeHolder,
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
function attachCnodeQuickRefs(cnode, vnode, element) {
  if (vnode.ref !== undefined) {
    cnode.view.refs[vnode.ref] = element
  }
}

function handleInitialNaiveVnode(vnode, cnode, view, patch, currentPath, parentNode) {
  const element = view.createElement(vnode)
  parentNode.appendChild(element)
  // Save it for update
  patch.element = element

  // Save references of root vnode and vnode with `ref` attribute
  attachCnodeQuickRefs(cnode, vnode, element)

  if (vnode.children !== undefined) {
    patch.children = []
    /* eslint-disable no-use-before-define */
    handleInitialVnodeChildren(vnode.children, cnode, view, patch.children, currentPath, element)
    /* eslint-enable no-use-before-define */
  }
}

export function handleInitialVnode(vnode, cnode, view, parentPatch, parentPath, parentNode, index) {
  const patch = cloneVnode(vnode)
  parentPatch[index] = patch

  const currentPath = createVnodePath(vnode, parentPath)
  // vnode types:
  // 1) text/string/null
  if (vnode.type === null) return
  if (vnode.type === String) {
    const element = view.createElement(vnode)
    patch.element = element
    return parentNode.appendChild(element)
  }

  // CAUTION we do not flatten array, because React do not too.
  // There will be a empty element in path, it is ok.
  if (vnode.type === Array) {
    /* eslint-disable no-use-before-define */
    return handleInitialVnodeChildren(vnode.children, cnode, view, patch.children, currentPath, parentNode)
    /* eslint-enable no-use-before-define */
  }

  // 2) normal node
  if (!isComponentVnode(vnode)) {
    return handleInitialNaiveVnode(vnode, cnode, view, patch, currentPath, parentNode)
  }

  // 3) component node
  if (isComponentVnode(vnode)) {
    /* eslint-disable no-use-before-define */
    return handleInitialComponentNode(vnode, cnode, view, patch, currentPath, parentNode)
    /* eslint-enable no-use-before-define */
  }
}

function handleInitialVnodeChildren(vnodes, cnode, view, patch, parentPath, parentNode) {
  // vnodes conditions:
  // 1) vnode children
  // 2) vnode of array type
  vnodes.forEach((vnode, index) => {
    if (vnode.action && vnode.action.type === PATCH_ACTION_MOVE_FROM) {
      handleMoveFromPatchNode(vnode, patch, parentPath, cnode, parentNode, view)
    } else {
      handleInitialVnode(vnode, cnode, view, patch, parentPath, parentNode, index)
    }
  })
}

function handleInitialComponentNode(vnode, cnode, view, patch, currentPath, parentNode) {
  const currentPathStr = vnodePathToString(currentPath)
  const nextIndex = vnode.transferKey === undefined ? currentPathStr : vnode.transferKey
  const childCnode = cnode.next[nextIndex]
  childCnode.patch = []
  prepareCnodeForView(childCnode, vnode, parentNode, view)
  attachCnodeQuickRefs(cnode, vnode, nextIndex)

  patch.element = nextIndex
}


// initialDigest handle the whole tree
export default function initialDigest(cnode, view) {
  if (cnode.parent === undefined) prepareCnodeForView(cnode, createElement(cnode.type), view.getRoot(), view)
  if (cnode.view.placeHolder === undefined) throw new Error(`cnode is not prepared for initial digest ${cnode.type.displayName}`)
  cnode.patch = []
  const fragment = view.createFragment()
  handleInitialVnodeChildren(cnode.ret, cnode, view, cnode.patch, [], fragment)
  const parentNode = cnode.view.placeHolder.parentNode
  parentNode.insertBefore(fragment, cnode.view.placeHolder.nextSibling)
  parentNode.removeChild(cnode.view.placeHolder)
  delete cnode.view.placeHolder
  cnode.view.parentNode = parentNode
  cnode.isDigested = true
}

