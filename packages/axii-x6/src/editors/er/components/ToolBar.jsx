/** @jsx createElement */
import {
  createElement,
  render,
  reactive,
  ref,
  refComputed,
  useViewEffect,
  useRef,
  toRaw,
  computed,
} from 'axii'
import {Icon} from 'axii-components'

export default function ToolBar({ commands }) {
  return (
    <toolbar block>
      <item onClick={commands.copy}>
        <Icon type="copy"/>
      </item>
    </toolbar>
  )
}
