/** @jsx createElement */
import {
  createElement,
  propTypes,
  reactive,
  delegateLeaf,
  createComponent,
  computed,
} from 'axii'
import { Input, Select, Button, Checkbox } from 'axii-components'

/**
 * node 是个 x6 对象，还是要和 axii 中的数据同步，这种情况怎么处理？
 *
 * 或者不用同步，仍然是读 x6 的数据。
 * 只是要通知 axii 刷新，最好还能"精确更新"。
 *
 * 在 reactive 体系下，"正确"的做法应该是什么？
 * 好像可以通过伪造一个 ref, 利用 ref 来刷新，利用 onChange 同步回视图就行了，
 * 但这样数据就不是"单项"的了，出现异常的时候怎么"处理"？？
 *
 * TODO
 *  1. defaultValue
 *  2. allowNull
 *  3. string|number size
 */

function ConfigEntity({entity, graph, customFields = []}) {
  const addField = () => {
    entity.fields.push({
      id: graph.createId(),
      name: '',
      type: 'string'
    })
  }

  const removeField = (field) => {
    entity.fields.splice(entity.fields.indexOf(field), 1)
  }

  const options = computed(() => ['string', 'number', 'boolean', 'rel'].concat(customFields))

  const match = (value, option) => {
    return value === option.name
  }

  const optionToValue = option => option
  const renderOption = option => option
  const renderValue = value => value.value

  return (
    <panel block block-margin-10px>
      <panelBlock block block-margin-bottom-30px>
        <blockTitle block block-margin-10px block-margin-left-0>名称</blockTitle>
        <Input value={delegateLeaf(entity).name}/>
      </panelBlock>
      <panelBlock block block-margin-bottom-30px>
        <blockTitle block block-margin-10px block-margin-left-0>字段</blockTitle>
        {() => entity.fields.map(field => {
          return (
            <filed block block-padding-bottom-10px>
              <Input
                value={delegateLeaf(field).name}
                layout:inline-width-120px
                layout:inline-margin-right-10px
              />
              <Select
                layout:inline-width-50px
                layout:inline-margin-right-10px
                value={delegateLeaf(field).type}
                options={options}
                match={match}
                optionToValue={optionToValue}
                renderOption={renderOption}
                renderValue={renderValue}
              />
              <Checkbox
                layout:inline-width-60px
                layout:inline-margin-right-10px
                value={delegateLeaf(field).isCollection}
              >
                集合
              </Checkbox>
              <Button danger onClick={() => removeField(field)}>删除</Button>
            </filed>
          )
        })}
        <Button primary onClick={addField}>新增字段</Button>
      </panelBlock>
      <panelBlock block block-margin-bottom-30px>
        <blockTitle block block-margin-10px block-margin-left-0>通用</blockTitle>
        <Checkbox
          layout:inline-width-100px
          layout:inline-margin-right-10px
          value={delegateLeaf(entity).belongToUser}
        >
          属于用户
        </Checkbox>
      </panelBlock>
    </panel>
  )
}

ConfigEntity.propTypes = {
  node: propTypes.object.default(() => reactive({})),
  customFields: propTypes.object.default(() => reactive([]))
}

ConfigEntity.Style = (fragments) => {
  const el = fragments.root.elements
  el.title.style({

  })

  el.deleteHandle.style({
    cursor: 'pointer',
  })
}

export default createComponent(ConfigEntity)
