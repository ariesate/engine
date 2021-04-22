/** @jsx createElement */
/** @jsxFrag Fragment */
import {
	createElement,
	createComponent,
	useRef,
	propTypes,
	atom,
	atomComputed,
	computed,
	reactive,
	Fragment,
} from 'axii'
import useLayer from "../hooks/useLayer";
import {nextTick} from "../util";
import Input from "../input/Input";
import scen from "../pattern";


function renderOptionList(options, openedIds, index, props, fragments) {
		return (
			<optionList inline key={index}>
				{() => options.map(option => fragments.optionItem({ option })(
					<optionItem
						block
						block-font-size={scen().fontSize()}
						block-padding={`${scen().spacing(-1)}px ${scen().spacing()}px `}
						onClick={() => {
							if (option.children && option.children.length !== 0) {
								props.onOpen(option, index)
							} else {
								props.onChange(option)
								props.onBlur()
							}

						}}
					>
						{option.name}
						{(option.children && option.children.length!== 0) ? '>' : ''}
					</optionItem>
				))}
			</optionList>)
}

// TODO 有 openedIds 就显示 openedIds。没有就显示 value 的。
// TODO 异步加载数据?
export function Cascader(props, fragments) {
	const {value, options, renderValue, onFocus, focused, openedIds} = props

	const optionsIndexedById = computed(() => {
		const result = {}

		function collectOption(items) {
			items.forEach(item => {
				result[item.id] = item
				if( item.children ) {
					collectOption(item.children)
				}
			})
		}

		collectOption(options)

		return result
	})


	const optionContainerRef = useRef()

	const getContainerRect = ({top, left, height}) => {
		return {
			top: height + top,
			left,
		}
	}

	const onInputFocus = () => {
		// CAUTION 这里 onFocus() 的写法，不传参很重要，这样 callback 系统补齐的默认参数顺序才正确
		onFocus()
		// 在 nextTick 中 focus calendar 是因为在当前是在 onFocus 事件中，focus 到别的 element 上没用。用 e.preventDefault 也不行
		nextTick(() => optionContainerRef.current.focus())
	}

	const {source, node: optionContainerNode} = useLayer((sourceRef) => {
		// 每次 blur，都把 openedIds 清空。
		return (
			<optionContainer
				inline
				flex-display
				tabindex={-1}
				onFocusOut={() => props.onBlur()}
				inline-display-none={atomComputed(() => !focused.value)}
				style={{background: "#fff", zIndex: 99}}
				ref={optionContainerRef}
			>
				{fragments.optionList({ items: options })(
					() => renderOptionList(options, openedIds, 0, props, fragments)
				)}

				{() => openedIds.map((id, index) =>
						fragments.optionsList({ items: optionsIndexedById[id]})(
							() => renderOptionList(optionsIndexedById[id].children, openedIds, index + 1, props, fragments)
						)
					)
				}
			</optionContainer>)
	}, {
		getContainerRect,
	})

	return (
		<>
			<selectInput
				inline
				use={Input}
				ref={source}
				onFocus={onInputFocus}
				focused={focused}
				onBlur={() => false}
				value={atomComputed(() => renderValue(value))}
			>
			</selectInput>
			{optionContainerNode}
		</>
	)
}

Cascader.propTypes = {
	value: propTypes.object.default(() => atom([])),
	options: propTypes.object.default(() => reactive([])),
	focused: propTypes.bool.default(() => atom(false)),
	onFocus: propTypes.callback.default(() => ({focused}) => focused.value = true),
	onBlur: propTypes.callback.default(() => ({focused, openedIds}) => {
		openedIds.splice(0)
		focused.value = false
	}),

	match: propTypes.function.default(() => (value, option) => {
		return value.value ? value.value.id === option.id : false
	}),
	renderOption: propTypes.function.default(() => (option) => option.name),
	renderValue: propTypes.function.default(() => (value) => {
		if (!value.value) return ''
		return value.value.map(item => {
			return item.name
		}).join('/')
	}),
	assignOption: propTypes.function.default(() => (target, source) => Object.assign(target, source)),
	onChange: propTypes.callback.default(() => (option, { openedIds, options, value, assignOption }) => {
		const next = []
		let currentList = options
		openedIds.forEach((id) => {
			const openedItem = currentList.find(item => item.id === id)
			// 注意这里复制到 next 里面的去掉 children，免得数据结构太复杂。
			next.push(assignOption({}, { ...openedItem, children: undefined }))
			currentList = openedItem.children
		})
		value.value = next.concat(assignOption({}, option))
	}),
	openedIds: propTypes.array.default(() => reactive([])),
	onOpen: propTypes.callback.default(() => (item, index, { openedIds }) => {
		openedIds.splice(index)
		openedIds[index] = item.id
	})
}

Cascader.Style = (fragments) => {
	fragments.optionItem.elements.optionItem.style(({ openedIds, value, option, match}) => {
		const opened = openedIds.includes(option.id)

		return {
			background: opened?
				scen().inverted().active().bgColor() :
				scen().active().bgColor(),
			color: opened ? scen().interactable().active().inverted().color() : scen().color(),
			cursor: 'pointer',
		}
	})

	fragments.root.elements.optionContainer.style({
		boxShadow: scen().elevate().shadow(0),
	})
}

export default createComponent(Cascader)
