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

// Axii node 只是负责做声明周期的管理，其他的能力全部 delegate 给里面的 axii 组件。
// data 才是真正传给里面组件用的数据
export default function Node({component, config = {}, ...componentProps}) {
  const graphRef = useContext(GraphContext)

  useViewEffect(() => {
    const node = graphRef.value.addNode({
      shape: 'axii-shape',
      component,
      ...config,
      // CAUTION axii-shape 会把 data 作为 Props 传给组件。同时还会加上 graph/node 这两个 props
      data: componentProps,
    })

    return () => {
      graphRef.value.removeNode(node)
    }
  })

  return null
}

