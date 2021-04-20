/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  createElement,
  createComponent,
  useRef,
  propTypes,
  ref,
  refComputed,
  Fragment,
} from 'axii'
import useLayer from "../hooks/useLayer";
import {nextTick} from "../util";
import Input from "../input/Input";
import scen from "../pattern";

export function Select({value, options, onChange, renderOption, renderValue, onFocus, onBlur, focused}, fragments) {
  const optionListRef = useRef()

  const onInputFocus = () => {
    // CAUTION 这里 onFocus() 的写法，不传参很重要，这样 callback 系统补齐的默认参数顺序才正确
    onFocus()
    // 在 nextTick 中 focus calendar 是因为在当前是在 onFocus 事件中，focus 到别的 element 上没用。用 e.preventDefault 也不行
    nextTick(() => optionListRef.current.focus())
  }

  const getContainerRect = ({top, left, height}) => {
    return {
      top: height + top,
      left,
    }
  }

  const {source, node: optionListNode} = useLayer((sourceRef) => {
    return (
      <optionList
        inline
        inline-display-none={refComputed(() => !focused.value)}
        inline-min-width={refComputed(() => `${sourceRef.value ? sourceRef.value.offsetWidth : 0}px`)}
        tabindex={-1}
        onFocusOut={() => onBlur()}
        style={{background: "#fff", zIndex: 99}}
        ref={optionListRef}
      >
        {() => options.map(option => fragments.optionItem({ option })(
          <optionItem
            block
            block-font-size={scen().fontSize()}
            block-padding={`${scen().spacing(-1)}px ${scen().spacing()}px `}
            onClick={() => {
              onChange(option)
              onBlur()
            }}
          >
            {renderOption(option)}
          </optionItem>
        ))}
      </optionList>)
    }, {
      getContainerRect,
    })

  return (
    <container block flex-display-inline>
      <selectInput
        layout:inline
        layout:inline-max-width="100%"
        use={Input}
        ref={source}
        onFocus={onInputFocus}
        focused={focused}
        onBlur={() => false}
        value={refComputed(() => renderValue(value))}
      >
      </selectInput>
      {optionListNode}
    </container>
  )
}

Select.propTypes = {
  value: propTypes.object.default(() => ref(undefined)),
  options: propTypes.object.default(() => reactive([])),
  focused: propTypes.bool.default(() => ref(false)),
  onFocus: propTypes.callback.default(() => ({focused}) => focused.value = true),
  onBlur: propTypes.callback.default(() => ({focused}) => {
    focused.value = false
  }),

  match: propTypes.function.default(() => (value, option) => {
    return value.value ? value.value.id === option.id : false
  }),
  renderOption: propTypes.function.default(() => (option) => option.name),
  renderValue: propTypes.function.default(() => (value) => value.value ? value.value.name : ''),
  optionToValue: propTypes.function.default(() => (option) => Object.assign({}, option)),
  onChange: propTypes.callback.default(() => (option, {value, optionToValue}) => {
    value.value = optionToValue(option)
  }),
}

Select.Style = (fragments) => {
  fragments.optionItem.elements.optionItem.style(({ value, option, match}) => {
    const equal = match(value, option)

    return {
      background: equal?
        scen().inverted().active().bgColor() :
        scen().active().bgColor(),
      color: equal ? scen().interactable().active().inverted().color() : scen().color(),
      cursor: 'pointer',
    }
  })

  fragments.root.elements.optionList.style({
    boxShadow: scen().elevate().shadow()
  })
}

// TODO Select 的搜索 feature & 动态 option feature
// TODO Select 的多选 feature

export default createComponent(Select)
