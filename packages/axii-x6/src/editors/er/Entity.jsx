/** @jsx createElement */
import {
  createElement,
  createComponent,
  useViewEffect,
  propTypes,
  atom,
  reactive,
  watch,
  traverse,
  computed,
  useContext,
} from 'axii'
import {useElementPosition, manualTrigger as createManualTrigger } from 'axii-components'
import Port from './Port'
import { PORT_JOINT } from "./EREditor";
import ViewContext from '../../shape/context'

/**
 * 字段的所有选项：
 * type : string|number|boolean|array|graph(map|tree)  | rel(关联字段)
 *
 * defaultValue
 * allowNull
 *
 * 对于 string: max-length
 * 对于 number: max|min
 *
 * TODO
 * 1. 能改 field
 * 2. type 为 rel 时展示 port
 */
// function Field({ name, defaultValue, allowNull, type }) {
//   const options = [{
//     name: 'string'
//   }, {
//     name: 'number'
//   }, {
//     name: 'boolean'
//   },{
//     name: 'rel',
//   }]
//
//   return (
//     <field>
//       <Input value={name} onClick={e => e.stopPropagation()}/>
//       <Select value={type} options={options} />
//     </field>
//   )
// }

function RawField({ field, entityPosition, positionTrigger }) {

  const fieldPosition = reactive({})
  const {ref: fieldRef} = useElementPosition(fieldPosition, positionTrigger)

  const portPosition = computed(() => {

    const result = {}
    // 如果 fieldPosition
    if (field.type === 'rel' && fieldPosition.y && entityPosition.y) {
      const y = fieldPosition.y - entityPosition.y + (fieldPosition.height/2)

      result.right = {
        x: "100%",
        y
      }

      result.left = {
        x: 0,
        y
      }

    }

    return result
  })

  // TODO 监听形状变化。任何形状变化。都会引起其他的位置变化。所以要
  useViewEffect(() => {
    return () => {}
  })

  return (
    <field block ref={fieldRef} block-padding-10px>
      <name>{() => field.name}</name>
      <type inline inline-margin-left-10px>{() => `${field.type}${field.isCollection? '[]' : ''}`}</type>
      {() => portPosition.left ? <Port group="right" key={field.id} id={[field.id, 'left'].join(PORT_JOINT)} args={portPosition.left}/> : null}
      {() => portPosition.right ? <Port group="left" key={field.id} id={[field.id,'right'].join(PORT_JOINT)} args={portPosition.right}/> : null}
    </field>
  )
}

RawField.propTypes = {
  name: propTypes.string.default(() => atom('')),
  type: propTypes.string.default(() => atom('')),
}

RawField.Style = (fragments) => {
  fragments.root.elements.type.style({
    color: 'blue'
  })
}

const Field = createComponent(RawField)


// 真正用 axii 来渲染的组件
function Entity({ entity, onChange }) {

  const { fields } = entity

  const entityPosition = reactive({})
  const positionTrigger = createManualTrigger()
  const {ref: entityRef} = useElementPosition(entityPosition, positionTrigger)

  useViewEffect(() => {
    if (onChange) {
      watch(() => traverse(entity), onChange)
    }

    positionTrigger.trigger()
    return () => {
      positionTrigger.destroy()
    }
  })

  return (
    <entity inline inline-border-width-1px ref={entityRef}>
      <name block block-padding-4px>{() => entity.name}</name>
      {() => fields.map(field=> (
        <row block>
          <Field key={field.id} field={field} entityPosition={entityPosition} positionTrigger={positionTrigger}/>
        </row>
      ))}
    </entity>
  )
}

Entity.Style = (fragments) => {
  const el = fragments.root.elements

  const { node } = useContext(ViewContext);

  el.entity.style(props => {
    const result = {
      background: '#fff',
      borderColor: '#333',
      borderStyle: 'solid',
      overflow: 'visible',
      opacity: 1,
    };

    const portAttrs = {
      circle: {
        opacity: 1,
      }
    };

    // entity及下属的port都在Style中统一处理
    if (!props.selected?.value) {
      Object.assign(result, {
        opacity: 0.2,
      });
      Object.assign(portAttrs.circle, {
        opacity: 0.2,
      })
    }

    node.getPorts().forEach(port => {
      if (port.attrs?.circle?.opacity !== portAttrs.circle.opacity) {
        // setPortProp会阻塞，使用Idle降低卡顿感
        requestIdleCallback(() => {
          node.setPortProp(port.id, { attrs: portAttrs })
        });
      }
    });

    return result;
  });

  el.name.style({
    background: '#0060a0',
    color: '#fff',
  })

  el.field.style({
    borderColor: '#333',
    whiteSpace: 'nowrap',
    overflow: 'visible'
  })
}

export default createComponent(Entity)
