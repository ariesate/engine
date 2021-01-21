/** @jsx createElement */
import { createElement, createComponent } from 'axii'

// 真正用 axii 来渲染的组件
function Entity({ entity }) {
  const { name, fields } = entity
  // TODO 处理 field 的增删
  // TODO 处理 port port 的外键是有规则的，有外键的话，type 定义就没意义了

  return (
    <entity block block-border-width-1px>
      <name block>{name}</name>
      {fields.map(field=> (
        <field inline inline-border-1px inline-padding-10px>
          {field.name}
        </field>
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
