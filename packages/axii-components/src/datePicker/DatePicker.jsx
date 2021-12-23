/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  createElement,
  propTypes,
  createComponent,
  atomComputed,
  useRef,
  atom,
  Fragment,
} from 'axii'
import {nextTick} from '../util';
import Input from '../input/Input'
import Calendar from '../calendar/Calendar.jsx'
import useLayer from '../hooks/useLayer.jsx'
import scen from '../pattern/index.js'
import moment from 'moment';

export function DatePicker({focused, onFocus, onBlur, value, onChange, format,}) {
  const calendarRef = useRef()

  const onInputFocus = () => {
    // CAUTION 这里 onFocus() 的写法，不传参很重要，这样 callback 系统补齐的默认参数顺序才正确
    onFocus()
    // 在 nextTick 中 focus calendar 是因为在当前是在 onFocus 事件中，focus 到别的 element 上没用。用 e.preventDefault 也不行
    nextTick(() => calendarRef.current.focus())
  }

  const getContainerRect = ({top, left, height}) => {
    return {
      top: height + top,
      left,
    }
  }

  const {source, node: calendar} = useLayer(
    <calendarContainer
      inline
      tabindex={-1}
      onFocusOut={() => onBlur()}
      inline-display-none={atomComputed(() => !focused.value)}
      ref={calendarRef}
    >
      <calendar use={Calendar} value={value} onChange={onChange}/>
    </calendarContainer>, {
      getContainerRect,
      visible: atomComputed(() => focused.value)
    })

  return <>
    <input
      use={Input}
      ref={source}
      onFocus={onInputFocus}
      focused={focused}
      onBlur={() => false}
      value={atomComputed(() => value.value.format(format.value))}
    />
    {calendar}
  </>
}

DatePicker.propTypes = {
  focused: propTypes.bool.default(() => atom(false)),
  onFocus: propTypes.callback.default(() => ({focused}) => focused.value = true),
  onBlur: propTypes.callback.default(() => ({focused}) => {
    focused.value = false
  }),
  value: propTypes.object.default(() => atom(moment())),
  onChange: propTypes.callback.default(() => ({year, month, date}, {value}) => {
    // 可以什么也不做，复用 calendar 的行为
  }),
  format: propTypes.string.default(() => atom('YYYY-MM-DD'))
}

DatePicker.Style = (fragments) => {
  fragments.root.elements.calendarContainer.style({
    boxShadow: scen().elevate().shadow(),
    background: scen().active().bgColor(),
    zIndex: scen().picker().zIndex()
  })
}

export default createComponent(DatePicker)
