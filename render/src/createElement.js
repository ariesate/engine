import VNode from './VNode'
import { makeVnodeKey } from './common'

/**
 * 合法的 children 类型: null/array/string/number/VNode
 * @param type
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

  const children = rawChildren.map((rawChild, index) => {
    let child = rawChild
    if (rawChild === undefined) throw new Error('element cannot be undefined')
    if (rawChild === null) {
      child = { type: null }
    } else if (Array.isArray === null) {
      child = { type: Array, children: rawChild }
    } else if (typeof rawChild === 'number' || typeof rawChild === 'string') {
      child = { type: String, value: child.toString() }
    }
    // 剩下的只有对象了，我们给所有没 key 的节点都用 index 加上 key。这样之后运算方便。
    // 并且 key 上面带有 type 信息，这样保证 <div key="1" /> 和 <span key="1" /> 最后真正的 key 肯定不同
    Object.assign(child, { key: makeVnodeKey(child, index) })
    return child
  })

  node.children = children

  return node
}
