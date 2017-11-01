import VNode from './VNode'

export function normalizeChildren(rawChildren) {
  return rawChildren.map((rawChild) => {
    let child = rawChild
    if (rawChild === undefined) throw new Error('element cannot be undefined')
    if (rawChild === null) {
      child = { type: null }
    } else if (Array.isArray(child)) {
      child = { type: Array, children: normalizeChildren(rawChild) }
    } else if (typeof rawChild === 'number' || typeof rawChild === 'string') {
      child = { type: String, value: child.toString() }
    }

    return child
  })
}

/**
 * @param type {Null|Array|String|Number|VNode}
 * @param attributes
 * @param rawChildren
 * @returns {VNode}
 */
// TODO 不需要 normalize, 直接在 createElement 判断就行。
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
