/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  propTypes,
  createElement,
  Fragment,
  ref,
  createComponent,
  refComputed,
  vnodeComputed,
} from 'axii';
import scen from '../pattern'
/**
 * Input feature 规划：
 * feature 并不是独立增加的单元，只是一种隔离代码的方式。如果组件结构复杂，那么最好在一开始就规划好。
 * 或者有个规划位置的作为 base。
 */

export function Checkbox({ value, disabled, onChange, children }, context, fragments ) {
  return (
    <container use="label" inline flex-display-inline flex-align-items-center>
      <input type="checkbox" value="" disabled={disabled} checked={value} onChange={onChange} />
      <span>{children}</span>
    </container>
  )
}


Checkbox.propTypes = {
  value: propTypes.bool.default(() => ref(false)),
  disabled: propTypes.bool.default(() => ref(false)),
  onChange: propTypes.callback.default(() => ({ value }) => {
    value.value = !value.value
  })
}

Checkbox.Style = (fragments) => {
  const rootElements = fragments.root.elements

  rootElements.input.style({
    lineHeight: "14px"
  })

}

Checkbox.Style.propTypes = {
  focused: propTypes.bool.default(() => ref(false)),
  onChangeFocus: propTypes.callback.default(() => (nextFocused, { focused }) => focused.value = nextFocused)
}

export default createComponent(Checkbox)

