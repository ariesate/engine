/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  createElement,
  propTypes,
  createComponent,
  refComputed,
  useRef,
  ref,
  Fragment,
} from 'axii'
import { nextTick } from '../util';
import Input from '../input/Input'
import useLayer from '../hooks/useLayer.jsx'

/**
 *
 * TODO 怎么解决 timeout？是否要增加一个事件回调的 after 标记？等事件执行完后由系统调用？这个需求的本质是什么？
 */

export function DatePicker({ focused, onFocus, onBlur }) {
  const calendarRef = useRef()

  const onInputFocus = () => {
    // CAUTION 这里 onFocus() 的写法，不传参很重要，这样 callback 系统补齐的默认参数顺序才正确
    onFocus()
    // 在 nextTick 中 focus calendar 是因为在当前是在 onFocus 事件中，focus 到别的 element 上没用。用 e.preventDefault 也不行
    nextTick(()=> calendarRef.current.focus())
  }

  const getCalendarPosition = ({ top, left, width, height }) => {
    return {
      top: height + top,
      left,
    }
  }

  const { source, node: calendar} = useLayer(<calendar
    inline
    tabindex={-1}
    onFocusOut={() => onBlur()}
    inline-display-none={refComputed(() => !focused.value)}
    style={{background:"#fff", zIndex: 99}}
    ref={calendarRef}
  >
    choose date
  </calendar>, {
    getPosition: getCalendarPosition
  })

  return <>
    <input use={Input} ref={source} onFocus={onInputFocus} focused={focused} onBlur={() => false}/>
    {calendar}
  </>
}

DatePicker.propTypes = {
  focused: propTypes.bool.default(() => ref(false)),
  onFocus: propTypes.callback.default(() => ({ focused }) => focused.value = true),
  onBlur: propTypes.callback.default(() => ({ focused }) => {focused.value = false}),
}



export default createComponent(DatePicker)
