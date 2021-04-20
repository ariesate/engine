/** @jsx createElement */
/** @jsxFrag Fragment */
import {
	createElement,
	createComponent,
	useRef,
	propTypes,
	ref,
	refComputed,
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
						flex-display
						flex-justify-content-space-between
						onClick={() => {
							if (option.children && option.children.length !== 0) {
								props.onOpen(option, index)
							} else {
								props.onChange(option)
								props.onBlur()
							}

						}}
					>
						<optionItemName>
							{option.name}
						</optionItemName>

							{(option.children && option.children.length!== 0) ? (
								<optionItemIcon inline inline-margin-left-10px>></optionItemIcon>
							) : null}
					</optionItem>
				))}
			</optionList>)
}

// TODO 有 openedIds 就显示 openedIds。没有就显示 value 的。
// TODO 异步加载数据?
export function OptionTree(props, fragments) {
	const {options, openedIds} = props

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

	return (
		<optionContainer
			inline
			flex-display
			tabindex={-1}
			onFocusOut={() => props.onBlur()}
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
		</optionContainer>
	)
}

OptionTree.propTypes = {
	value: propTypes.object.default(() => ref([])),
	options: propTypes.object.default(() => reactive([])),
	focused: propTypes.bool.default(() => ref(false)),
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

OptionTree.Style = (fragments) => {
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
}

export default createComponent(OptionTree)
