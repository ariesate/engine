/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  createElement,
  createComponent,
  useRef,
  propTypes,
  atom,
  atomComputed,
  reactive,
  delegateLeaf,
  overwrite,
} from 'axii'
import useLayer from "../hooks/useLayer";
import {composeRef, nextTick} from "../util";
import Input from "../input/Input";
import Checkbox from '../checkbox/Checkbox';
import scen from "../pattern";
import Down from 'axii-icons/Down';

export function Select({value, options, onChange, renderOption, onActiveOptionChange, activeOptionIndex, renderValue, onFocus, onBlur, focused, ref}, fragments) {
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

  const onKeyDown = (e) => {
    if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(e.code)) return
    e.preventDefault()
    e.stopPropagation()
    if (e.code === 'ArrowDown') {
      if (activeOptionIndex.value < options.length - 1) {
        onActiveOptionChange(activeOptionIndex.value + 1)
      }
    } else if (e.code === 'ArrowUp'){
      if (activeOptionIndex.value > -1) {
        onActiveOptionChange(activeOptionIndex.value - 1)
      }
    } else if(e.code === 'Enter') {
      onChange(options[activeOptionIndex.value])
      onBlur()
    }
  }

  const {source, node: optionListNode} = useLayer((sourceRef) => {
    return (
      <optionList
        inline
        inline-min-width={atomComputed(() => `${sourceRef.value ? sourceRef.value.offsetWidth : 0}px`)}
        tabindex={-1}
        onKeyDown={onKeyDown}
        onFocusOut={() => onBlur()}
        ref={optionListRef}
      >
        {() => options.map((option, index) => fragments.optionItem({ option, index })(
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
      visible: atomComputed(() => focused.value)
    })

  return (
    <container block flex-display-inline>
      <selectInput
        layout:inline
        layout:inline-width="100%"
        use={Input}
        ref={composeRef(ref,  source)}
        onFocus={onInputFocus}
        focused={focused}
        onBlur={() => false}
        value={atomComputed(() => renderValue(value))}
      >
        {{
          after: <Down />
        }}
      </selectInput>
      {optionListNode}
    </container>
  )
}

Select.propTypes = {
  value: propTypes.object.default(() => atom(undefined)),
  options: propTypes.object.default(() => reactive([])),
  activeOptionIndex: propTypes.object.default(() => atom(-1)),
  focused: propTypes.bool.default(() => atom(false)),
  onFocus: propTypes.callback.default(() => ({focused, activeOptionIndex}) => {
    focused.value = true
    activeOptionIndex.value = -1
  }),
  onBlur: propTypes.callback.default(() => ({focused, activeOptionIndex}) => {
    focused.value = false
    activeOptionIndex.value = -1
  }),
  match: propTypes.function.default(() => (value, option) => {
    return value.value ? value.value.id === option.id : false
  }),
  renderOption: propTypes.function.default(() => (option) => option.name),
  renderValue: propTypes.function.default(() => (value) => value.value ? value.value.name : ''),
  optionToValue: propTypes.function.default(() => (option) => Object.assign({}, option)),
  onChange: propTypes.callback.default(() => (option, {value, optionToValue}) => {
    if (!optionToValue) return
    value.value = optionToValue(option)
  }),
  onActiveOptionChange: propTypes.callback.default(() => (index, {activeOptionIndex}) => {
    activeOptionIndex.value = index
  }),
}

Select.Style = (fragments) => {
  fragments.optionItem.elements.optionItem.style(({ value, option, match, index, activeOptionIndex}) => {
    const equal = match(value, option)
    const isActive = activeOptionIndex.value === index

    return {
      background: (equal || isActive)?
        scen().inverted().active().bgColor(isActive ? -2 : 0) :
        scen().active().bgColor(),
      color: equal ? scen().interactable().active().inverted().color() : scen().color(),
      cursor: 'pointer',
    }
  })

  fragments.root.elements.optionList.style({
    boxShadow: scen().elevate().shadow(),
    zIndex: scen().picker().zIndex(),
    background: scen().active().bgColor()
  })
}

Select.forwardRef = true

/**
 * TODO 搜索模式。支持回车选中。
 * 理论上回车的时候如果没有，或者blur 的时候没有，应该是什么样子？
 *
 */
export function SearchableFeature(fragments) {
  // TODO
}

SearchableFeature.propTypes = {
  searchable :propTypes.object.default(() => atom(false)),
  allOptions: propTypes.object.default(() => reactive([])),
}

/**
 * 推荐模式
 * 注意推荐模式和搜索模式心智完全不同。搜索模式中 value 不能超出 option 的范围，而推荐则是 value 以 input 为准。
 */
export function RecommendMode(fragments) {
  // 1. 修改 input 的 value，使得可以输入，每次输入的时候更新 options
  fragments.root.modify((result, { onFocus, onBlur, focused, activeOptionIndex, onActiveOptionChange, inputToValue, onChange, options, onRenderOptionChange, onPressEnter }) => {

    const inputNode = result.children[0]
    const inputRef = useRef()
    // 增加 ref， 后面 blur 的时候要用。
    inputNode.ref = composeRef(inputNode.ref, inputRef)

    // 允许实时修改值，改值的时候 Options 也跟着变
    const onInputChange = ({ value: inputValue }) => {
      const nextValue = inputToValue(inputValue.value)
      onChange(nextValue)
      onRenderOptionChange(nextValue)
    }

    // 增加 enter
    // TODO 增加上下键 navigate
    const onKeyDown = (e) => {

      if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(e.code)) return
      e.preventDefault()
      e.stopPropagation()
      if (e.code === 'ArrowDown') {
        if (activeOptionIndex.value < options.length - 1) {
          onActiveOptionChange(activeOptionIndex.value + 1)
        }
      } else if (e.code === 'ArrowUp'){
        if (activeOptionIndex.value > -1) {
          onActiveOptionChange(activeOptionIndex.value - 1)
        }
      } else if(e.code === 'Enter') {
        onPressEnter()
        inputRef.current.blur()
        onBlur()
      }

      // if (e.code === 'Enter') {
      //   onPressEnter()
      //   inputRef.current.blur()
      // }
    }

    Object.assign(inputNode.attributes, {
      onFocus: () => onFocus(),
      onChange: onInputChange,
      // TODO 这里有个问题，如果 input 自己控制 Blur, 那么浮层上面的 onClick 就没法触发，因为 onBlur 发生在前面。浮层已经收起来了。
      // 如果 input 不控制 blur，那么丢失焦点就没用了。先用 nextTick 强行解决一下
      // CAUTION 本质上是"人在脑中的具有英国的事件应该都要发生，并且同时"
      onKeyDown,
      onBlur: overwrite(() => {
        // TODO 这里还一定得是数值足够大 timeout 才行，得等 onClick 触发了，才能 blur。
        setTimeout(() => {
          // 如果 focused.value 已经是 false, 说明是 click 了具体的选项，执行了 onBlur。
          // 如果不是，说明是光标丢失，需要执行 blur。
          // 这个判断我们得过一段时间才能真正确定是为什么 blur。
          if (focused.value) onBlur()
        }, 50)
      }),
    })

  })
}

RecommendMode.match = ({ recommendMode }) => recommendMode

RecommendMode.propTypes = {
  allOptions: propTypes.object.default(() => reactive([])),
  recommendMode : propTypes.feature.default(() => false),
  delegateValue : propTypes.function.default(() => (value) => delegateLeaf(value).name),
  inputToValue: propTypes.function.default(() => (v) => ({ name: v })),
  filter: propTypes.function.default(() => (value, allOptions) => {
    return allOptions.filter(o => {
      const exp = new RegExp(`${value.name}`)
      return exp.test(o.name)
    })
  }),
  onRenderOptionChange: propTypes.callback.default(() =>(value, { options, filter, allOptions }) => {
    options.splice(0, options.length, ...filter(value, allOptions))
  }),
  matchInputValue: propTypes.function.default(() => (value, option) => {
    return value.value.name === option.name
  }),
  // TODO 理论上需要更容易的机制来透传对 Input 的控制。这里先快速实现一下。
  onPressEnter: propTypes.callback.default(() =>({value, onChange, matchInputValue, options, activeOptionIndex}) => {
    if (options[activeOptionIndex.value]) {
      onChange(options[activeOptionIndex.value])
    } else {
      // 如果能匹配，就选中匹配的。
      const matchedOption = options.find(option => matchInputValue(value, option))
      if (matchedOption) onChange(matchedOption)
    }
  }),
}

// TODO Select 的多选 feature
export function MultipleMode(fragments) {
  fragments.optionItem.modify((item, { onChange, match, value, option, index }) => {
    const checked = atom(match(value, option))
    console.log(checked.value)
    const onClick = (option, index) => {
      checked.value = !checked.value
      onChange(option, checked.value, index)
    }
    item.attributes.onClick = () => onClick(option, index)
    item.children.unshift(<Checkbox value={checked} />)

    return item
  })
}

MultipleMode.propTypes = {
  multi : propTypes.feature.default(() => false),
}

MultipleMode.match = ({ multi }) => multi

export default createComponent(Select, [SearchableFeature, RecommendMode, MultipleMode])
