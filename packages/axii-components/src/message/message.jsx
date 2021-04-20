/** @jsx createElement */
/** @jsxFrag Fragment */
import { render, ref, reactive, refComputed, createElement, Fragment } from 'axii'
import layerStyle  from '../style/layer'
import scen, { colors } from "../pattern";

function defaultCreateContainer() {
	const portalRoot = document.createElement('div')
	document.body.appendChild(portalRoot)
	return portalRoot
}

function defaultGetPosition() {
	return {}
}

function defaultGetStyle() {
	return {
		...layerStyle,
		padding: scen().spacing()
	}
}

function defaultGetLayoutStyle() {
	return {
		display: 'inline-flex',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 20
	}
}

function defaultCreateCommonMessage(text, color, type) {
	return <>
		<indicator inline flex-align-self-stretch inline-width-4px  style={{background: color}}/>
		<span inline inline-padding-left-10px inline-padding-right-10px>{text}</span>
	</>
}

export function createMessage(
	{
		createContainer = defaultCreateContainer,
		getPosition = defaultGetPosition,
		getStyle = defaultGetStyle,
		getLayoutStyle = defaultGetLayoutStyle,
		duration = 2000,
		createCommonMessage = defaultCreateCommonMessage
	} = {}) {

	const container = createContainer()
	// CAUTION 不要用 reactive，因为这里的语义不适用，而且 content 可能会有 vnode 节点。会出现问题。
	const contents = ref([])
	// const visible = refComputed(() => contents.length !== 0)
	const visible = ref(true)

	const containerStyle = refComputed(() => {
		return {
			display: visible.value ? 'block' : 'none',
			position: 'fixed',
			top: 0,
			left: 0,
			width: '100%',
			// 因为这个 container 是完整的横条，所以要穿透事件，不要挡住了下面的元素。
			pointerEvents: 'none',
			zIndex: 999,
		}
	})

	const messageContainerStyle = {
		display: 'flex',
		width: '100%',
		pointerEvents: 'none',
		justifyContent: 'center',
	}

	const style = refComputed(() => {
		const positionStyle = getPosition(container.getBoundingClientRect())
		const otherStyle = getStyle()
		const layoutStyle = getLayoutStyle()
		return {
			display: 'inline-block',
			...positionStyle,
			...otherStyle,
			...layoutStyle,
		}
	})

	const show = (v) => {
		contents.value = contents.value.concat(v)

		//TODO 也要设计一下, 这是对系统能力的使用
		setTimeout(() => {
			contents.value = contents.value.filter(c => c!==v )
		}, duration)
	}

	function Message() {
		return <container style={containerStyle}>
			{() => contents.value.map(content => (
				<messageContainer style={messageContainerStyle}>
					<message style={style}>
						{content}
					</message>
				</messageContainer>
			))}
		</container>
	}

	render(<Message />, container)

	return {
		success: (text) => show(defaultCreateCommonMessage(text, colors.green())),
		warning: (text) => show(defaultCreateCommonMessage(text, colors.gold())),
		error: (text) => show(defaultCreateCommonMessage(text, colors.red())),
		info: (text) => show(defaultCreateCommonMessage(text, colors.blue())),
		show
	}

}

export default createMessage()

