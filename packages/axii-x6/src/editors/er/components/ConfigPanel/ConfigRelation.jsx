/** @jsx createElement */
import {
  createElement,
  useViewEffect,
  propTypes,
  ref,
  overwrite,
  reactive,
  delegateLeaf,
  watch
} from 'axii'
import { Input, Select } from 'axii-components'

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
 */

export default function ConfigRelation({relation, graph, customFields}) {

  const options = ['1:1', '1:n', 'n:1', 'n:n']

  const match = (value, option) => {
    return value === option
  }

  const optionToValue = option => option
  const renderOption = option => option
  const renderValue = value => value.value

  return (
    <panel block>
      <h3>名称</h3>
      <Input value={delegateLeaf(relation).name}/>
      <h3>类型</h3>
      <Select
        value={delegateLeaf(relation).type}
        options={options}
        match={match}
        optionToValue={optionToValue}
        renderOption={renderOption}
        renderValue={renderValue}
      />
    </panel>
  )
}

ConfigRelation.propTypes = {
  relation: propTypes.object.default(() => reactive({})),
  customFields: propTypes.object.default(() => reactive([]))
}