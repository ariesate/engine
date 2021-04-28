/** @jsx createElement */
import {
  createElement,
  useViewEffect,
  useContext,
  watch,
  traverse,
  toRaw
} from 'axii'
import {GraphContext} from "./Graph.jsx";
import { shallowEqual } from "../util";

/**
 * nextNodes 是个数组，表示后面并行，应该是先并行，再分支。
 */
export default function Edge({ source, target, attrs, labels, onChange, ...rest }) {
  const graphRef = useContext(GraphContext)

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
      labels,
      ...rest
    })


    watch(() => traverse(attrs), () => {
      edge.setAttrs(toRaw(attrs), true)
    })


    // watch source
    watch(() => traverse(source), () => {
      console.log("source change", source)
      const rawSource = toRaw(source)
      if (!shallowEqual(rawSource, edge.getSource())) {
        edge.setSource(rawSource, true)
      }
    })

    // watch target
    watch(() => traverse(target), () => {
      const rawTarget = toRaw(target)
      console.log("target change", target, edge.getTarget())
      if (!shallowEqual(rawTarget, edge.getTarget())) {
        edge.setTarget(rawTarget, true)
      }
    })

    // watch target
    watch(() => traverse(labels), () => {
      console.log("labels change", toRaw(labels))
      // CAUTION x6会用引用判定所以要复制
      edge.setLabels(toRaw(labels).slice())
    })




    return () => {
      console.log(111111111)
      graphRef.value.removeEdge(edge)
    }
  })

  return null
}

