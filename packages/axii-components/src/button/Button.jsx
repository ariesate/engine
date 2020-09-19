import { propTypes, createElement, ref, createComponent } from 'axii'
import scen from "../pattern";

export function Button({ children, onClick, disabled }) {
	return <button onClick={() => (!disabled.value) && onClick && onClick()}>{children}</button>
}

Button.propTypes = {
	onClick: propTypes.function,
	disabled: propTypes.bool.default(() => ref(false)),
}

Button.Style = (fragments) => {
	const primaryColor = 'blue'
	const dangerColor = 'red'

	fragments.root.elements.button.style(({ danger, primary, disabled }) => {
		const hasColor = danger.value || primary.value
		const color = hasColor ? (danger.value ? dangerColor : primaryColor) : undefined

		const colorScen = scen().interactable()
		if (hasColor) colorScen.inverted()
		if (disabled.value) colorScen.inactive()

		return {
			borderRadius: 2,
			borderColor: hasColor ? colorScen.bgColor(0, color) : colorScen.color(),
			cursor: disabled.value ? 'not-allowed' : 'pointer',
			color: colorScen.color(0, color),
			background: colorScen.bgColor(0, color),
			outline: 'none'
		}
	})
}

Button.Style.propTypes = {
	danger: propTypes.bool.default(() => ref(false)),
	primary: propTypes.bool.default(() => ref(false)),
}

export default createComponent(Button)
