/** @jsx createElement */
import {
  createElement,
  useViewEffect,
  useRef,
  createContext,
  ref,
  reactive,
  useContext,
  watch,
  traverse,
  destroyComputed,
  toRaw
} from 'axii'
import {GraphContext} from "./Graph.jsx";
import { shallowEqual } from "../util";

/**
 * nextNodes 是个数组，表示后面并行，应该是先并行，再分支。
 */
export default function Edge({ source, target, attrs, label, ...rest }) {
  const graphRef = useContext(GraphContext)

  // TODO 监听 target 的变化？

  useViewEffect(() => {
    const edge = graphRef.value.addEdge({
      router: 'manhattan',
      attrs: {
        line: {
          stroke: '#5F95FF',
          strokeWidth: 1,
          targetMarker: {
            name: 'classic',
            size: 8,
          },
        },
        ...attrs
      },
      source,
      target,
      label: label.value,
      ...rest
    })


    const [_, watchToken] = watch(() => traverse(attrs), () => {
      edge.setAttrs(toRaw(attrs), true)
    })

    // watch source
    const [__, watchSourceToken] = watch(() => traverse(source), () => {
      const rawSource = toRaw(source)

      if (!shallowEqual(rawSource, edge.getSource())) {
        edge.setSource(rawSource, true)
      }
    })

    // watch target
    const [___, watchTargetToken] = watch(() => traverse(target), () => {
      const rawTarget = toRaw(target)
      console.log("target change")
      if (!shallowEqual(rawTarget, edge.getTarget())) {
        console.log("setTarget", rawTarget, edge.getTarget())
        edge.setTarget(rawTarget, true)
      }
    })

    // watch label
    const [____, watchLabelToken] = watch(() => label.value, () => {
      edge.setLabels([label.value])
    })

    return () => {
      graphRef.value.removeEdge(edge)
      destroyComputed(watchToken)
      destroyComputed(watchSourceToken)
      destroyComputed(watchTargetToken)
      destroyComputed(watchLabelToken)
    }
  })



  return null
}

