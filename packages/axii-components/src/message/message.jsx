/** @jsx createElement */
/** @jsxFrag Fragment */
import { render, ref, refComputed, createElement, Fragment } from 'axii'
import scen, { colors } from "../pattern";
import Icon from '../icon/Icon'

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
		background: '#fff',
		borderRadius: 2,
		boxShadow: '0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08), 0 9px 28px 8px rgba(0,0,0,.05)'
	}
}

function defaultGetLayoutStyle() {
	return {
		display: 'inline-flex',
		justifyContent: 'center',
		alignItems: 'center'
	}
}

export function createMessage(
	{
		createContainer = defaultCreateContainer,
		getPosition = defaultGetPosition,
		getStyle = defaultGetStyle,
		getLayoutStyle = defaultGetLayoutStyle,
		duration = 2000
	} = {}) {

	const container = createContainer()
	const content = ref('')
	const visible = ref(false)

	const containerStyle = refComputed(() => {
		return {
			display: visible.value ? 'flex' : 'none',
			position: 'fixed',
			justifyContent: 'center',
			top: 0,
			left: 0,
			width: '100%',
			overflow: 'visible',
			zIndex: 999,
		}
	})

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
		content.value = v
		visible.value = true
		//TODO 也要设计一下
		setTimeout(() => {
			visible.value = false
		}, duration)
	}

	function Message() {
		return <container style={containerStyle}>
			<msg style={style}>
				{content}
			</msg>
		</container>
	}

	render(<Message />, container)

	// TODO icon 太土了！！！！再考虑吧
	return {
		success: (text) => show(<contentValue>
			<icon use={Icon} type="CheckCircle" color={colors.green(0)}/>
			<span inline inline-padding-left-10px>{text}</span>
			</contentValue>),
		warning: (text) => show(<>
			<icon use={Icon} type="ExclamationCircle" color={colors.gold()}/>
			<span inline inline-padding-left-10px>{text}</span>
		</>),
		error: (text) => show(<>
			<icon use={Icon} type="CloseCircle" color={colors.red()}/>
			<span inline inline-padding-left-10px>{text}</span>
		</>),
		info: (text) => show(<>
			<icon use={Icon} type="InfoCircle" color={colors.blue()}/>
			<span inline inline-padding-left-10px>{text}</span>
		</>),
		show
	}

}

export default createMessage()

