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
// componentProps 才是真正传给里面组件用的数据
export default function AxiiNode({id, shape='axii-shape', component, viewProps = {}, ...componentProps}) {
  const graphRef = useContext(GraphContext)

  useViewEffect(() => {
    const node = graphRef.value.addNode({
      id,
      shape,
      component,
      ...viewProps,
      // CAUTION 只能写成这样是应为初始化是 x6 会对参数深度 clone，导致 reactive 引用丢失。
      getAxiiProps: () => componentProps,
    })

    // TODO 处理位置等信息的同步

    return () => {
      graphRef.value.removeNode(node)
    }
  })

  return null
}

