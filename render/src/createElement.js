import VNode from './VNode'

export default function createElement(name, attributes, ...children) {
  const node = new VNode()
  Object.assign(node, { name, attributes: attributes || {}, children })
  return node
}
