/** @jsx createElement */
/** @jsxFrag Fragment */
import {
	propTypes,
	createElement,
	Fragment,
	ref,
	createComponent,
	refComputed,
	vnodeComputed,
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

function renderItem(item, level, onFold, onOpen, fragments) {
	const hasChildren = refComputed(() => item.children && item.children.length !== 0)
	return <>
		<item
			block
			block-padding-left={refComputed(() => scen().spacing() * level)}
			flex-display
			flex-justify-content-space-between
		>
			<name>{item.title}</name>
			{function icon(){ return hasChildren.value ?
				(item.fold ?
					<expand onClick={() => onOpen(item)}>+</expand> :
					<fold onClick={() => onFold(item)}>-</fold>
				) :
				null
			}}
		</item>
		{function menuChildren() {
			if (!item.children || item.children.length === 0 || item.fold) return null
			// if (item.title ==='sub1') debugger
			return item.children.map(child => {
				const nextLevel = level + 1
				return fragments.item({ item : child, level: nextLevel })(renderItem(child, nextLevel, onFold, onOpen, fragments))
			})
		}}
	</>
}

export function Menu({data, onFold, onOpen}, fragments) {
	return (<container block block-max-width-300px>
		{() => data.map(item => fragments.item({item})(renderItem(item, 0, onFold, onOpen, fragments)))}
	</container>)
}

// TODO 这里问题来了，不应该直接修改数据引用，而应该用 draft！！！怎么办？？
// 1. 写组件的时候要求传 path， 然后用path 去修改
// 2. 对所有参数都打上 draft!!!
Menu.propTypes = {
	onFold: propTypes.callback.default(() => (item) => item.fold = true),
	onOpen: propTypes.callback.default(() => (item) => item.fold = false),
}

Menu.Style = (fragments) => {

	fragments.item.elements.expand.style({
		cursor: 'pointer'
	})

	fragments.item.elements.fold.style({
		cursor: 'pointer'
	})

	fragments.item.elements.name.style(({ level }) => {
		return {
			color: level > 0 ? scen().color(-5) : scen().color(5)
		}
	})
}


export default createComponent(Menu)

