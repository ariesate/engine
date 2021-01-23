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
import Port from '../../components/Port'


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

function RawField({ name, type, onPosition }) {
  const el = useRef()

  useViewEffect(() => {
    onPosition(el.getBoundingClientRect())

    // TODO 定时检测？？？position 会受到其他人影响。
    return () => {
      onPosition(null)
    }
  })

  return (
    <field ref={el}>
      <name>{name}</name>
      <type>{type}</type>
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


  const fieldPositionsByFieldId = {}

  return (
    <entity inline inline-border-width-1px>
      <name block>{() => entity.name}</name>
      {() => fields.map(field=> (
        <row block>
          <Field {...delegateLeaves(field)} onPosition={position => fieldPositionsByFieldId[field.id] = ref(position)}/>
          {() => field.type === 'rel' ? <Port args={fieldPositionsByFieldId[field.id]}/> : null}
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
