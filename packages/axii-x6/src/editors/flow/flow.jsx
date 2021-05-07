/** @jsx createElement */
import { createElement, reactive, atom, useViewEffect, useRef } from 'axii'
import copyTextToClipboard from 'copy-text-to-clipboard'
import '../../reset.less'
import '../../global.css'
import { GraphContext } from '../../components/Graph'
import styles from '../index.module.less'
import rawData from './data'
import {createUniqueIdGenerator, indexBy} from '../../util'
import { EventNode, EventEdges } from "./components/EventNode.jsx";
import createFlowGraph from './createFlowGraph'
import ConfigPanel from './components/ConfigPanel'

const createId = createUniqueIdGenerator()

function getContainerSize() {
  return {
    width: document.body.offsetWidth - 581,
    height: document.body.offsetHeight,
  }
}

function createNodeByViewNode(viewNode) {
  if (viewNode.shape === 'event-node') return {
    name: '事件节点',
    nextParallelBranches: []
  }

  if (viewNode.shape === 'response-node') return {
    name: '响应节点',
    nextParallelBranches: []
  }

  if (viewNode.shape === 'response-node') return {
    name: '响应节点',
    nextParallelBranches: []
  }

  return {
    name: viewNode.attrs.text.text
  }
}


export default function Editor() {
  const nodes= reactive(rawData)

  const containerRef = useRef()
  const stencilRef = useRef()
  const graphRef = atom()
  const selectedNodeRef = atom()


  const onEventNodeClick = (nextNode) => selectedNodeRef.value = nextNode
  const onGraphClick = () => selectedNodeRef.value = null
  const onEdgeConnect = ({ edge }) => {
    // 找到 source /target
    const source = edge.getSource()
    const target = edge.getTarget()

    const node = nodes.find(n => n.id === source.cell)
    const parallel = node.nextParallelBranches.find(parallel => parallel.id === source.port)
    // console.log(parallel, edge)
    const branch = parallel.conditionBranches.find(b => b.id === edge.id)
    branch.target = { id: target.cell }
    // console.log(JSON.stringify(toRaw(nodes)), '\n', 4)
  }

  const onAddNode = (viewNode, position ) => {
    nodes.push({
      id: createId(),
      shape: viewNode.shape,
      view: {
        position
      },
      ...createNodeByViewNode(viewNode),
    })
    return false
  }

  useViewEffect(() => {
    const onSave = (e, graph) => {
      e.preventDefault()
      const viewNodes = graph.getNodes()
      const viewNodesById = indexBy(viewNodes, 'id')

      copyTextToClipboard(`const data = ${JSON.stringify(nodes.map(node => ({
        ...node,
        view: {
          position: viewNodesById[node.id].position()
        }
      })), null, 4)}; export default data;`)
    }

    const graph = createFlowGraph(containerRef.current, stencilRef.current, { onAddNode, onSave })

    // @ts-ignore
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
      <div className={styles.content}>
        <div id="stencil" ref={stencilRef} className={styles.sidebar} />
        <div className={styles.panel}>
          <div id="container" className="x6-graph" ref={containerRef}/>
        </div>
        <div className={styles.config}>
          {() => graphRef.value? <ConfigPanel graph={graphRef.value} node={selectedNodeRef}/> : null}
        </div>
      </div>
      <GraphContext.Provider value={graphRef}>
        {() => graphRef.value ? nodes.map(node => <EventNode node={node} onClick={onEventNodeClick}/>): null}
        {() => graphRef.value ? nodes.map(node => <EventEdges node={node} /> ): null}
      </GraphContext.Provider>
    </div>
  )
}
