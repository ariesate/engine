/** @jsx createElement */
import { createElement, render, reactive, ref, refComputed, useViewEffect, useRef, toRaw } from 'axii'
import copyTextToClipboard from 'copy-text-to-clipboard'
import '../../reset.less'
import '../../global.css'
import { GraphContext } from '../../components/Graph'
import styles from './index.module.less'
import rawData from './data'
import { createUniqueIdGenerator } from '../../util'
import AxiiNode from "../../components/AxiiNode";
import createERGraph from './createERGraph'
import ConfigPanel from './components/ConfigPanel'

const createId = createUniqueIdGenerator()

function getContainerSize() {
  return {
    // TODO 留给了 config panel 的宽度。这里不应该这样搞，应该去读能用的宽高
    width: document.body.offsetWidth - 290,
    height: document.body.offsetHeight - 87,
  }
}

export default function EREditor() {
  const entities = reactive(rawData)
  const containerRef = useRef()
  const stencilRef = useRef()
  const graphRef = ref()
  const selectedEntityRef = ref()

  const copy = () => {
    // const { graph } = FlowGraph
    // copyTextToClipboard(`const data = ${JSON.stringify(graph.toJSON(), null, 4)}; export default data;`)
    // alert("成功")
  }

  // TODO 因为 node click 的事件不是由我们的组件自己决定发出的，所以没发写在自己组件里面，并传相应的值，只能写在这里。
  const onNodeClick = ({node, e}) => {
    if (node.getAxiiProps) {
      selectedEntityRef.value = node.getAxiiProps().entity
    }
  }
  const onGraphClick = () => selectedEntityRef.value = null
  const onEdgeConnect = ({ edge }) => {
    // 找到 source /target
    const source = edge.getSource()
    const target = edge.getTarget()

    const node = entities.find(n => n.id = source.cell)
    const parallel = node.nextParallelBranches.find(parallel => parallel.id === source.port)

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
      // const { width, height } = getContainerSize()
      // graph.resize(width, height)
      graph.resize(containerRef.current.clientWidth, containerRef.current.clientHeight)

    }
    resizeFn()
    window.addEventListener('resize', resizeFn)

    graph.on('blank:click', onGraphClick)
    graph.on('blank:dblclick', onAddNode)
    graph.on('edge:connected', onEdgeConnect)
    graph.on('node:click', onNodeClick)

    return () => {
      window.removeEventListener('resize', resizeFn)
      graph.off('blank:click', onGraphClick)
      graph.off('blank:dblclick', onGraphClick)
      graph.off('edge:connected', onEdgeConnect)
      graph.off('node:click', onNodeClick)
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
        <div className={styles.config}>
          {() => graphRef.value? <ConfigPanel graph={graphRef.value} entity={selectedEntityRef}/> : null}
        </div>
      </div>
      <GraphContext.Provider value={graphRef}>
        {() => graphRef.value ? entities.map(entity => <AxiiNode key={entity.id} shape='entity-shape' component="Entity" viewProps={entity.view} entity={entity}/>): null}
      </GraphContext.Provider>
    </div>
  )
}
