/** @jsx createElement */
import {
  createElement,
  createComponent,
  useViewEffect,
  delegateLeaves,
  propTypes,
  ref,
  reactive,
  useRef,
  computed,
} from 'axii'
import Select from 'axii-components/select/Select'
import OriginInput from 'axii-components/input/Input'
import useElementPosition from 'axii-components/hooks/useElementPosition'
import createMannualTrigger from 'axii-components/hooks/mannualTrigger'
import Port from './Port'


const Input = OriginInput.extend(function CaptureClick(fragments) {

})

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
      console.log("computing", entityPosition, fieldPosition, field.id)
      result.x = "100%"
      result.y = fieldPosition.y - entityPosition.y + (fieldPosition.height/2)
    }
    return result
  })

  // TODO 监听形状变化。任何形状变化。都会引起其他的位置变化。所以要
  useViewEffect(() => {
    console.log(1111, portPosition.x)
    return () => {

    }
  })

  return (
    <field block ref={fieldRef} block-padding-20px>
      <name>{() => field.name}</name>
      <type>{() => field.type}</type>
      {() => portPosition.x ? <Port group="right" key={field.id} id={field.id} args={portPosition}/> : null}
    </field>
  )
}

RawField.propTypes = {
  name: propTypes.string.default(() => ref('')),
  type: propTypes.string.default(() => ref('')),
}

RawField.Style = (fragments) => {
  fragments.root.elements.type.style({
    color: 'blue'
  })
}

const Field = createComponent(RawField)





// 真正用 axii 来渲染的组件
function Entity({ entity }) {

  const { fields } = entity

  const entityPosition = reactive({})
  const positionTrigger = createMannualTrigger()
  const {ref: entityRef} = useElementPosition(entityPosition, positionTrigger)

  useViewEffect(() => {
    positionTrigger.trigger()
    return () => {
      positionTrigger.destroy()
    }
  })

  return (
    <entity inline inline-border-width-1px ref={entityRef}>
      <name block>{() => entity.name}</name>
      {() => fields.map(field=> (
        <row block>
          <Field key={field.id} field={field} entityPosition={entityPosition} positionTrigger={positionTrigger}/>
        </row>
      ))}
    </entity>
  )
}

Entity.Style = (fragments) => {
  fragments.root.elements.entity.style({
    background: '#fff',
    borderColor: '#333',
    borderStyle: 'solid',
    overflow: 'visible',
  })

  fragments.root.elements.field.style({
    borderColor: '#333',
    whiteSpace: 'nowrap',
    overflow: 'visible'
  })
}

export default createComponent(Entity)
