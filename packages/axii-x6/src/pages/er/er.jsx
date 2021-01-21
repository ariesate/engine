/** @jsx createElement */
import { createElement, render, reactive, ref, refComputed, useViewEffect, useRef, toRaw } from 'axii'
import copyTextToClipboard from 'copy-text-to-clipboard'
import '../../reset.less'
import '../../global.css'
import '../../shape'
import { GraphContext } from '../../components/Graph'
import styles from './index.module.less'
import rawData from './data'
import { createUniqueIdGenerator } from '../../util'
import AxiiNode from "../../components/AxiiNode";
import createERGraph from './createERGraph'
import ConfigPanel from '../components/ConfigPanel'

const createId = createUniqueIdGenerator()

function getContainerSize() {
  return {
    width: document.body.offsetWidth,
    height: document.body.offsetHeight - 87,
  }
}

export default function Editor() {
  const entities = reactive(rawData)

  const containerRef = useRef()
  const stencilRef = useRef()
  const graphRef = ref()
  const selectedNodeRef = ref()

  const copy = () => {
    // const { graph } = FlowGraph
    // copyTextToClipboard(`const data = ${JSON.stringify(graph.toJSON(), null, 4)}; export default data;`)
    // alert("成功")
  }

  const onEventNodeClick = (nextNode) => selectedNodeRef.value = nextNode
  const onGraphClick = () => selectedNodeRef.value = null
  const onEdgeConnect = ({ edge }) => {
    // 找到 source /target
    const source = edge.getSource()
    const target = edge.getTarget()

    const node = entities.find(n => n.id = source.cell)
    const parallel = node.nextParallelBranches.find(parallel => parallel.id === source.port)
    console.log(parallel, edge)
    const branch = parallel.conditionBranches.find(b => b.id === edge.id)
    branch.target = { id: target.cell }
    // console.log(JSON.stringify(toRaw(entities)), '\n', 4)
  }

  const onAddNode = (position) => {
    entities.push({
      id: createId(),
      name: '事件节点',
      position,
      nextParallelBranches: []
    })
    return false
  }

  useViewEffect(() => {
    const graph = createERGraph(containerRef.current, stencilRef.current, onAddNode)
    graph.createId = createId


    graphRef.value = graph
    const resizeFn = () => {
      const { width, height } = getContainerSize()
      graph.resize(width, height)
    }
    resizeFn()
    window.addEventListener('resize', resizeFn)

    graph.on('blank:click', onGraphClick)
    graph.on('blank:dblclick', onAddNode)
    graph.on('edge:connected', onEdgeConnect)

    return () => {
      window.removeEventListener('resize', resizeFn)
      graph.off('blank:click', onGraphClick)
      graph.off('edge:connected', onEdgeConnect)
    }
  })



  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span>ER 图</span>
      </div>
      <div className={styles.content}>
        <div className={styles.panel}>
          <div className={styles.toolbar}></div>
          <div id="container" className="x6-graph" ref={containerRef}/>
        </div>
      </div>
      <GraphContext.Provider value={graphRef}>
        {() => graphRef.value ? entities.map(entity => <AxiiNode component="Entity" entity={entity} />): null}
      </GraphContext.Provider>
    </div>
  )
}
