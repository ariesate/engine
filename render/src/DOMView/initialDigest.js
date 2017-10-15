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
 * dom ref 会出现在两个地方:
 * 1. cnode.view 上，如 rootRefs/refs/keyedRefs
 * 2. cnode.view.retRefs 上，跟树结构相关。在这个上面的 ref 主要是方便之后做 update 计算的
 */
function attachCnodeView(cnode, parentNode) {
  // 放在 cnode.view 上的 dom refs 主要有两个用途，
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

// 第三个参数如果是 string 说明当前标记 ref 的是个组件，要从 ctree 上面递归去查
function attachCnodeViewQuickRefs(cnode, vnode, element) {
  if (vnode.ref !== undefined) {
    cnode.view.refs[vnode.ref] = element
  }
}

function handleInitialNaiveVnode(vnode, cnode, view, vnodeRef, currentPath, parentNode) {
  const { createElement } = view

  const element = createElement(vnode)
  parentNode.appendChild(element)
  // 存起来，更新要用
  vnodeRef.element = element

  // 处理 rootRefs/refs
  attachCnodeViewQuickRefs(cnode, vnode, element)

  // 继续处理子节点
  if (vnode.children !== undefined) {
    vnodeRef.children = []
    /* eslint-disable no-use-before-define */
    handleInitialVnodeChildren(vnode.children, cnode, view, vnodeRef.children, currentPath, element)
    /* eslint-enable no-use-before-define */
  }
}


function handleInitialComponentNode(vnode, cnode, view, vnodeRef, currentPath, parentNode) {
  // 1. 为 cnode 建立 view 信息
  const currentPathStr = vnodePathToString(currentPath)
  const nextIndex = vnode.transferKey === undefined ? currentPathStr : vnode.transferKey
  const childCnode = cnode.next[nextIndex]
  attachCnodeView(childCnode, parentNode)

  // 我们不再使用函数引用的方式去记录 element，而是使用 path，由外部提供工具函数递归去查

  attachCnodeViewQuickRefs(cnode, vnode, nextIndex)

  vnodeRef.element = nextIndex

  const fragment = view.createFragment()

  /* eslint-disable no-use-before-define */
  const retRefs = []
  handleInitialVnodeChildren(childCnode.ret, childCnode, view, retRefs, [], fragment)
  /* eslint-enable no-use-before-define */
  // CAUTION 注意这里把 ret 替换成了 retRefs，这样使得 painter 之后 diff 的结果上就有 ref 了
  childCnode.patch = retRefs
  parentNode.appendChild(fragment)
  view.collectInitialDigestedCnode(childCnode)
}

export function handleInitialVnode(vnode, cnode, view, vnodesRef, parentPath, parentNode, index) {
  const vnodeRef = cloneVnode(vnode)
  vnodesRef[index] = vnodeRef

  const currentPath = createVnodePath(vnode, parentPath)
  // vnode 有几种情况:
  // 1. 文字/字符串/null
  if (vnode.type === null) return
  if (vnode.type === String) {
    const element = view.createElement(vnode)
    vnodeRef.element = element
    return parentNode.appendChild(element)
  }

  // 如果是数组，继续当前的解析就是，clone 出来的 vnodeRef 也是数组
  // path 中会多一个没有 name 的路径
  if (vnode.type === Array) {
    /* eslint-disable no-use-before-define */
    return handleInitialVnodeChildren(vnode.children, cnode, view, vnodeRef.children, currentPath, parentNode)
    /* eslint-enable no-use-before-define */
  }

  // 2. 普通dom节点
  if (!isComponentVnode(vnode)) {
    return handleInitialNaiveVnode(vnode, cnode, view, vnodeRef, currentPath, parentNode)
  }

  // 3. 组件节点
  if (isComponentVnode(vnode)) {
    return handleInitialComponentNode(vnode, cnode, view, vnodeRef, currentPath, parentNode)
  }
}

function handleInitialVnodeChildren(vnodes, cnode, view, vnodesRef, parentPath, parentNode) {
  // vnodes 有两种: 1是某个 vnode 的 children。2 是 array 类型的 vnode
  vnodes.forEach((vnode, index) => {
    if (vnode.action && vnode.action.type === PATCH_ACTION_MOVE_FROM) {
      handleMoveFromPatchNode(vnode, vnodesRef, parentPath, cnode, parentNode, view)
    } else {
      handleInitialVnode(vnode, cnode, view, vnodesRef, parentPath, parentNode, index)
    }
  })
}

// initialDigest 处理当前 ctree 下的所有 cnode
export default function initialDigest(ctree, view) {
  const parentNode = view.getRoot()
  attachCnodeView(ctree, parentNode)
  const fragment = view.createFragment()
  const retRefs = []
  handleInitialVnodeChildren(ctree.ret, ctree, view, retRefs, [], fragment)
  // CAUTION 这里将 ret 替换成了 retRefs，之后 painter 的 diff 结果里就会带上 dom ref
  ctree.patch = retRefs
  parentNode.appendChild(fragment)
  view.collectInitialDigestedCnode(ctree)
}

