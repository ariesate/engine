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

function RawField({ name, type }) {
  return (
    <field>
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
  // TODO 处理 port port 的外键是有规则的，有外键的话，type 定义就没意义了

  // TODO 怎么处理 Port 的位置才是正确的方法？？？
  // 本质上是 "被布局元素" 需要知晓"对应元素"的位置"信息"。
  // 在以往的情况下，可以把元素嵌入到"相应元素"中去，利用相对"布局"就行了。
  // 但是在这里，由于元素"不能嵌入"，所以得知道"相应元素"的位置，还得"实时调整"。

  const portArgsByFieldId = reactive({})
  const updatePortsArgs = () => {

  }
  // 1. fields 变化了要重新计算。
  // 2. 不管哪个变化了，都需要重新布局 Ports.
  const resizeObserver = new ResizeObserver(updatePortsArgs)

  const currentWatchEl = reactive({})
  const collectRef = (el, field) => {
    if (field.type === 'rel') {
      // 更新了 el 的时候要退掉前面的
      if (currentWatchEl[field.id]) resizeObserver.unobserve(currentWatchEl[field.id])
      currentWatchEl[field.id] = el
      // 有可能变成 null, 所以要判断
      if (currentWatchEl[field.id]) resizeObserver.observe(currentWatchEl[field.id])
    }
  }

  // 不管是 currentWatchEl 变了，还是 fields 变了，都会重新计算的
  const portArgsByFieldId = computed(() => {
    const result = {}
    fields.forEach((field) => {
      if (field.type === 'rel') {

      }
    })
    return result
  })

  useViewEffect(() => {
    // mount 了以后才立即执行一次
    updatePortsArgs()
    // 之后 任意一个 size 变化会触发。
    // fields 的变化也要触发？？？
    return () => {
      // 取消掉监听。
      resizeObserver.disconnect()
    }
  })

  return (
    <entity inline inline-border-width-1px>
      <name block>{() => entity.name}</name>
      {() => fields.map(field=> (
        <row block>
          <Field {...delegateLeaves(field)} ref={(el) => collectRef(el, field)}/>
          {() => field.type === 'rel' ? <Port args={portArgsByFieldId[field.id]}/> : null}
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
