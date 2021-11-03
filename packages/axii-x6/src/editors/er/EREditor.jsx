/** @jsx createElement */
import {
  createElement,
  reactive,
  atom,
  useViewEffect,
  useImperativeHandle,
  useRef,
  toRaw,
  debounceComputed,
} from 'axii'
import { message, Split } from 'axii-components'
import copyTextToClipboard from 'copy-text-to-clipboard'
import '../../reset.less'
import '../../global.css'
import { GraphContext } from '../../components/Graph'
import Relation from './Relation'
import styles from './index.module.less'
import {createUniqueIdGenerator, nextTick} from '../../util'
import AxiiNode from "../../components/AxiiNode";
import createERGraph from './createERGraph'
import ConfigPanel from './components/ConfigPanel'
import ToolBar from './components/ToolBar'

const createId = createUniqueIdGenerator()

function getContainerSize() {
  return {
    // TODO 留给了 config panel 的宽度。这里不应该这样搞，应该去读能用的宽高
    width: document.body.offsetWidth - 290,
    height: document.body.offsetHeight - 87,
  }
}

export const PORT_JOINT = '|'

export default function EREditor({ data: rawData, customFields, onChange, onSave }, editorRef) {

  const { entities, relations } = reactive(rawData)
  const containerRef = useRef()
  const graphRef = atom()
  const selectedItemRef = atom()
  const selectedTypeRef = atom('')

  if (editorRef) {
    useImperativeHandle(editorRef, () => ({
      getData() {
        return {
          entities: toRaw(entities),
          relations: toRaw(relations)
        }
      }
    }))
  }

  const commands = {
    copy: () => {
      copyTextToClipboard(`
const data = ${JSON.stringify({ entities: toRaw(entities), relations: toRaw(relations) }, null, 4)};
export default data;
`
      )
      message.success("成功")
    }
  }

  // TODO 因为 node click 的事件不是由我们的组件自己决定发出的，所以没发写在自己组件里面，并传相应的值，只能写在这里。
  const onCellClick = ({cell, e}) => {
    if (cell.isNode()) {
      if (cell.getAxiiProps) {
        selectedItemRef.value = entities.find(e => e.id === cell.id)
        selectedTypeRef.value = 'entity'
      }
    } else if (cell.isEdge()) {
      selectedItemRef.value = relations.find(e => e.id === cell.id)
      selectedTypeRef.value = 'relation'
    }
  }

  const onNodeMoved = ({ x, y, node}) => {
    const entity = entities.find(e => e.id === node.id)
    console.log(x, y)
    entity.view = {
      x, y
    }
  }

  const onGraphClick = () => {
    debounceComputed(()=>{
      selectedItemRef.value = null
      selectedTypeRef.value = 'graph'
    })
  }

  const onEdgeConnect = ({ edge, ...rest }) => {
    const target = edge.getTarget()
    const source = edge.getSource()
    if (!target || !source) {
      console.warn('target or source is null', target, source)
      return
    }

    const [sourceField, sourcePortSide] = source.port.split('|')
    const [targetField, targetPortSide] = target.port.split('|')

    relations.push({
      id: edge.id,
      name: 'newRelation',
      type: '1:1',
      source: {
        entity: source.cell,
        field: sourceField
      },
      target: {
        entity: target.cell,
        field: targetField
      },
      view: {
        sourcePortSide,
        targetPortSide,
      }
    })

    console.log("connected", edge.getSource())
  }

  const onEdgeDelete = ({ edge }) => {
    onGraphClick()
    const index = relations.findIndex(r => r.id === edge.id)
    if (index > -1) {
      relations.splice(index, 1)
    }
  }

  const onAddNode = ({ x, y }) => {
    entities.push({
      id: createId(),
      name: 'newEntity',
      view: {
        position: { x, y },
      },
      fields: []
    })
    return false
  }

  const onNodeDelete = ({ node }) => {
    const index = entities.findIndex(e => e.id === node.id)
    if (index > -1) {
      entities.splice(index, 1)
    }
  }

  const validateEdge = ({ edge, type, previous }) => {
    // CAUTION 我们希望一切都由我们数据驱动来控制，所以一直 return false。
    //  但 x6 的 validate return false 实际上是执行了 undo，无法真正的去阻止默认行为。
    //  所以我们只能在 nextTick 里修正，但这样界面会闪动一下。
    const source = edge.getSource()
    const target = edge.getTarget()
    console.log("validateEdge", source, target, type, previous)
    if (previous.cell) {
      // 说明是修改 target/source
      console.log(`change ${type}`, source, target, type, previous)
      // TODO 要修改数据。但是不需要重绘。
      const relation = relations.find(r => r.id === edge.id)
      nextTick(() => {
        debounceComputed(() => {
          const [sourceField, sourcePortSide] = source.port.split(PORT_JOINT)
          const [targetField, targetPortSide] = target.port.split(PORT_JOINT)
          relation.source = {
            entity: source.cell,
            field: sourceField
          }
          relation.target = {
            entity: target.cell,
            field: targetField
          }
          relation.view = {
            sourcePortSide,
            targetPortSide
          }
        })
      })

    } else {
      console.log(`new ${type}`, edge.id, source, target)
      // 说明是新增，不允许，改为手动新增。
      const [sourceFieldId, sourcePortSide] = source.port.split(PORT_JOINT)
      const [targetFieldId, targetPortSide] = source.port.split(PORT_JOINT)
      nextTick(() => {
        relations.push({
          id: edge.id,
          name: '',
          type: '1:1',
          source: {
            entity: source.cell,
            field: sourceFieldId
          },
          target: {
            entity: target.cell,
            field: targetFieldId
          },
          view: {
            sourcePortSide,
            targetPortSide
          }
        })
      })
    }
    // 阻止默认行为
    return false
  }

  useViewEffect(() => {
    const graph = createERGraph(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      connecting: { validateEdge }
    })
    graph.createId = createId
    graph.bindKey('cmd+s', (e) => {
      e.stopPropagation()
      e.preventDefault()
      if (onSave) onSave({ entities: toRaw(entities), relations: toRaw(relations) })
    })

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
    graph.on('edge:removed', onEdgeDelete)
    graph.on('node:removed', onNodeDelete)
    graph.on('cell:click', onCellClick)
    graph.on('node:moved', onNodeMoved)

    return () => {
      window.removeEventListener('resize', resizeFn)
      graph.off('blank:click', onGraphClick)
      graph.off('blank:dblclick', onGraphClick)
      graph.off('edge:connected', onEdgeConnect)
      graph.off('edge:removed', onEdgeDelete)
      graph.off('node:removed', onNodeDelete)
      graph.off('cell:click', onCellClick)
      graph.off('node:moved', onNodeMoved)
    }
  })

  return (
    <container block block-height="100%" style={{background: '#fff'}}>
      <Split layout:block layout:block-height="100%">
        <div block flex-display flex-direction-column block-height="100%">
          <div block flex-grow-0 className={styles.toolbar}>
            <ToolBar commands={commands}/>
          </div>
          <div block flex-grow-1 id="container" className="x6-graph" ref={containerRef}/>
        </div>
        <div className={styles.config}>
          {() => graphRef.value? <ConfigPanel graph={graphRef.value} item={selectedItemRef.value} type={selectedTypeRef} customFields={customFields}/> : null}
        </div>
      </Split>
      <GraphContext.Provider value={graphRef}>
        {() => graphRef.value ? entities.map(entity => <AxiiNode id={entity.id} key={entity.id} shape='entity-shape' component="Entity" viewProps={entity.view} entity={entity} onChange={onChange}/>): null}
        {() => graphRef.value ? relations.map(relation => <Relation key={relation.id} relation={relation} onChange={onChange} />) : null}
      </GraphContext.Provider>
    </container>
  )
}

EREditor.forwardRef = true
