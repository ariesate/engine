import VNode from './VNode'

export function normalizeLeaf(rawChild) {
  let child = rawChild
  if (rawChild === undefined) {
    child = { type: String, value: 'undefined'}
  } else if (rawChild === null) {
    child = { type: null }
  } else if (Array.isArray(rawChild)) {
    // Array 要把 raw 传过去。arrayComputed 要用。TODO 怎么更优雅一定
    child = { type: Array, children: normalizeChildren(rawChild), raw:rawChild }
    // child = { type: Array, children: normalizeChildren(rawChild)}
  } else if (typeof rawChild === 'number' || typeof rawChild === 'string') {
    child = { type: String, value: child.toString() }
  }
  // object/function
  return child
}

export function normalizeChildren(rawChildren) {
  return rawChildren.map(normalizeLeaf)
}


/**
 * @param type {Null|Array|String|Number|VNode}
 * @param attributes
 * @param rawChildren
 * @returns {VNode}
 */
export default function createElement(type, attributes, ...rawChildren) {
  const node = new VNode()

  Object.assign(node, { type, attributes: attributes || {} })

  if (node.attributes.ref !== undefined) {
    node.ref = node.attributes.ref
    delete node.attributes.ref
  }

  if (node.attributes.key !== undefined) {
    node.rawKey = node.attributes.key
    delete node.attributes.key
  }

  if (node.attributes.transferKey !== undefined) {
    node.rawTransferKey = node.attributes.transferKey
    delete node.attributes.transferKey
  }

  let childrenToAttach = rawChildren
  if (node.attributes.children !== undefined) {
    childrenToAttach = node.attributes.children
    delete node.attributes.children
  }

  if (node.attributes.forceUpdate !== undefined) {
    node.forceUpdate = node.attributes.forceUpdate
    delete node.attributes.forceUpdate
  }

  node.children = normalizeChildren(childrenToAttach)
  // TODO 之后全改成 props
  node.props = node.attributes
  return node
}

export function cloneElement(vnode, newAttributes) {
  return createElement(
    vnode.type,
    {
      ...vnode.attributes,
      key: vnode.key,
      ref: vnode.ref,
      transferKey: vnode.transferKey,
      ...newAttributes,
    },
    ...vnode.children,
  )
}
