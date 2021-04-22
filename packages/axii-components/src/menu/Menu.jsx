/** @jsx createElement */
/** @jsxFrag Fragment */
import {
	propTypes,
	createElement,
	Fragment,
	atom,
	createComponent,
	atomComputed,
	reactive,
	tryToRaw,
} from 'axii';
import DownIcon from 'axii-icons/Down.js'
import RightIcon from 'axii-icons/Right.js'
import scen from '../pattern'

/**
 * Menu feature 规划：
 * 根据数据渲染：
 * [{
 *   title: <String>|<Vnode>,
 *   expand: false,
 *   children: []
 * }]
 *
 */

function renderItem(item, level, actions, fragments, parents = []) {
	const { onFold, onOpen, onSetActive } = actions
	const hasChildren = atomComputed(() => item.children !== undefined)
	return <>
		<item
			block
			flex-display
			flex-align-items-center
		>
			<expand
				inline
				flex-display
				flex-align-items-center
				onClick={() => item.expand ? onFold(item, parents) : onOpen(item, parents)}>
				{() => hasChildren.value ? (item.expand ? <DownIcon/> : <RightIcon/>): null}
			</expand>
			<name block flex-grow-1 onClick={() => onSetActive(item, parents)}>{item.title}</name>
		</item>
		{function menuChildren() {
			if (!item.children || item.children.length === 0 || !item.expand) return null
			return item.children.map(child => {
				const nextLevel = level + 1
				return fragments.item({ item : child, level: nextLevel, parents: parents.concat(item) })(renderItem(child, nextLevel, actions, fragments, parents.concat(item)))
			})
		}}
	</>
}

export function Menu({data, onFold, onOpen, onSetActive}, fragments) {
	return (<container block>
		{function rootMenuData() { return data.map(item => fragments.item({item, level: 0, parents: []})(renderItem(item, 0, { onFold, onOpen, onSetActive }, fragments)))}}
	</container>)
}

Menu.propTypes = {
	data: propTypes.object.default(() => reactive([])),
	onFold: propTypes.callback.default(() => (item) => item.expand = false),
	onOpen: propTypes.callback.default(() => (item) => item.expand = true),
	onSetActive: propTypes.callback.default(() => (item, parents, { activeItemKeyPath }) => activeItemKeyPath.value = parents.concat(item).map(i => i.key)),
	activeItemKeyPath: propTypes.string.default(() => atom([]))
}

Menu.Style = (fragments) => {
	fragments.item.elements.expand.style({
		width: 20,
		userSelect: 'none',
		cursor: 'pointer'
	})

	fragments.item.elements.item.style(({ item, parents, activeItemKeyPath, level }) => {
		const currentPath = parents.concat(item)
		const isActive = activeItemKeyPath.value.length && (currentPath.length === activeItemKeyPath.value.length) && activeItemKeyPath.value.every((p, i) => p === currentPath[i]?.key)
		return {
			padding: scen().spacing(),
			paddingLeft: scen().spacing(2) * level,
			borderLeft : isActive ? `4px ${scen().interactable().active().color()} solid` : undefined,
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

