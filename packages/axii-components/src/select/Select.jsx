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
      top: height + top + 6,
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
    } else if (e.code === 'Enter') {
      onChange(options[activeOptionIndex.value])
      onBlur()
    }
  }

  const {source, node: optionListNode} = useLayer((sourceRef) => {
    return (
      <optionList
        inline
        inline-min-width={atomComputed(() => `${sourceRef.current ? sourceRef.current.offsetWidth : 0}px`)}
        tabindex={-1}
        onKeyDown={onKeyDown}
        onFocusOut={() => onBlur()}
        ref={optionListRef}
      >
        {() => options.map((option, index) => fragments.optionItem({ option, index })(
          <optionItem
            block
            block-font-size={scen().fontSize()}
            block-padding={`${scen().spacing()}px ${scen().spacing(1)}px `}
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
    activeOptionIndex.value = index < 0 ? 0 : index
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
    background: scen().active().bgColor(),
    width: '100%',
    borderRadius: scen().radius(1),
    overflow: 'hidden',
    outline: 'none'
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
      onKeyDown,
      // TODO 这里有个问题，因为为要监听 input 的 onBlur 来实现 blur 时隐藏浮层，但同时要支持点击浮层上的选项后影藏浮层。
      //  因为 onClick 在时间触发优先级上低于 onBlur。如果在 input onBlur 的瞬间直接调用整个 Select 的
      //  onBlur (onBlur 内部调用了 focused.value = false)，会使得浮层立刻收起，那么浮层上面的 onClick 就不会被触发。
      //  如果不使用 input 上的 onBlur，那么丢失焦点时浮层就不能收起来了。
      // CAUTION 本质上是"人在脑中的具有因果的事件应该都要发生，并且同时"。先利用下面的 onMouseDown 来替代 onClick，因为 onMouseDown 在 onBlur 之前触发。
      onBlur: overwrite(() => {
        if (focused.value) onBlur()
      })
    })
  })

  // 看上面的 onBlur 出的注释
  fragments.optionItem.modify((optionItemNode, {option, onChange, onBlur}) => {
    Object.assign(optionItemNode.attributes, {
      onMouseDown: () => {
        onChange(option)
        onBlur()
      },
      onClick: overwrite(() => {})
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
