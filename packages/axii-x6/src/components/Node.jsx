/** @jsx createElement */
import {
  createElement,
  useViewEffect,
  useRef,
  createContext,
  ref,
  useContext,
  watch,
  traverse,
  destroyComputed,
  toRaw,
  Fragment,
} from 'axii'
import { GraphContext } from "./Graph.jsx";

export const NodeContext = createContext()

// 接受 ports 作为 children
export default function Node({onClick, children, attrs, ...rest}) {
  const graphRef = useContext(GraphContext)
  const nodeRef = useRef()

  useViewEffect(() => {
    const node = graphRef.value.addNode({
      attrs,
      ...rest,
    })
    nodeRef.value = node

    // TODO 先粗糙处理 attrs 任何变化都重新设置 attrs， 第二参数表示深度 merge
    const [_, watchToken] = watch(() => traverse(attrs), () => {
      node.setAttrs(toRaw(attrs), true)
    })

    // 因为只能注册在 graph 上
    const clickCallback = ({ node: clickedNode }) => {
      if (clickedNode === node) onClick(clickedNode)
    }
    if (onClick) graphRef.value.on('node:click', clickCallback)

    return () => {
      graphRef.value.removeNode(node)
      if (onClick) graphRef.value.off('node:click', clickCallback)
      destroyComputed(watchToken)
    }
  })

  return <NodeContext.Provider value={nodeRef}>{children}</NodeContext.Provider>
}

