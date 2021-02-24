/** @jsx createElement */
/** @jsxFrag Fragment */
import {
	propTypes,
	createElement,
	Fragment,
	ref,
	createComponent,
	refComputed,
	reactive,
} from 'axii';
import scen from '../pattern'

/**
 * Menu feature 规划：
 * 根据数据渲染：
 * [{
 *   title: <String>|<Vnode>,
 *   fold: false,
 *   children: []
 * }]
 *
 */

function renderItem(item, level, actions, fragments, parents = []) {
	const { onFold, onOpen, onSetActive } = actions
	const hasChildren = refComputed(() => item.children !== undefined)
	return <>
		<item
			block
			flex-display
		>
			<expand onClick={() => item.fold ? onOpen(item, parents) : onFold(item, parents)}>{() =>
				hasChildren.value ?
					(item.fold ? '+' : '-'):
					null
			}</expand>
			<name block flex-grow-1 onClick={() => onSetActive(item)}>{item.title}</name>
		</item>
		{function menuChildren() {
			if (!item.children || item.children.length === 0 || item.fold) return null
			return item.children.map(child => {
				const nextLevel = level + 1
				return fragments.item({ item : child, level: nextLevel, parents: parents.concat(item) })(renderItem(child, nextLevel, actions, fragments, parents.concat(item)))
			})
		}}
	</>
}

export function Menu({data, onFold, onOpen, onSetActive}, fragments) {
	return (<container block block-max-width-300px>
		{() => data.map(item => fragments.item({item, level: 0, parents: []})(renderItem(item, 0, { onFold, onOpen, onSetActive }, fragments)))}
	</container>)
}

Menu.propTypes = {
	data: propTypes.object.default(() => reactive([])),
	onFold: propTypes.callback.default(() => (item) => item.fold = true),
	onOpen: propTypes.callback.default(() => (item) => item.fold = false),
	onSetActive: propTypes.callback.default(() => (item, { activeKey }) => activeKey.value = item.key),
	activeKey: propTypes.string.default(() => ref())
}

Menu.Style = (fragments) => {

	fragments.item.elements.expand.style({
		width: 20,
		userSelect: 'none',
		cursor: 'pointer'
	})

	fragments.item.elements.item.style(({ item, activeKey, level }) => {
		const isActive = activeKey.value === item.key
		return {
			paddingLeft: scen().spacing(2) * level,
			borderRight : isActive ? `4px ${scen().interactable().active().color()} solid` : undefined,
			background: isActive ? scen().interactable().active().color(-5) : 'transparent',
			userSelect: 'none',
			cursor: 'pointer'
		}
	})


	fragments.item.elements.name.style(({ level }) => {
		return {
			color: level > 0 ? scen().color(-5) : scen().color(5)
		}
	})
}


export default createComponent(Menu)

