/**@jsx createElement */
import { propTypes, createElement, atom, createComponent, computed } from 'axii'
import scen from "../pattern";

export function Button({ children, size, onClick, disabled }) {
	const padding = computed(() => {
		const data = size.value ? scen()[size.value]() : scen()
		const { horizontalPadding, verticalPadding } = data.components().button
		return { horizontalPadding, verticalPadding }
	})
	const lineHeight = scen().components().button.lineHeight
	return <button
		inline
		inline-padding-left={padding.horizontalPadding}
		inline-padding-right={padding.horizontalPadding}
		inline-padding-top={padding.verticalPadding}
		inline-padding-bottom={padding.verticalPadding}
		inline-line-height={lineHeight}
		onClick={() => (!disabled.value) && onClick && onClick()}>
		{children}
	</button>
}

Button.propTypes = {
	onClick: propTypes.function,
	disabled: propTypes.bool.default(() => atom(false)),
}

Button.Style = (fragments) => {
	const primaryColor = 'blue'
	const dangerColor = 'red'

	const getColorScen = ({ danger, primary, disabled }) => {
		const hasColor = danger.value || primary.value
		const color = hasColor ? (danger.value ? dangerColor : primaryColor) : undefined

		const colorScen = scen().interactable()
		if (hasColor) colorScen.inverted()
		if (danger.value) colorScen.danger()
		if (disabled.value) colorScen.inactive()
		return [hasColor, colorScen, color]
	}

	fragments.root.elements.button.style(({ danger, primary, disabled }) => {
		const [hasColor, colorScen, color] = getColorScen({ danger, primary, disabled })

		return {
			borderRadius: colorScen.radius(),
			border: `1px solid ${hasColor ? colorScen.bgColor(0, color) : colorScen.border().naturalColor()}`,
			cursor: disabled.value ? 'not-allowed' : 'pointer',
			color: colorScen.color(0, color),
			background: colorScen.bgColor(0, color),
			outline: 'none',
		}
	})

	fragments.root.elements.button.match.hover.style(({ danger, primary, disabled }) => {
		const [hasColor, colorScen, color] = getColorScen({ danger, primary, disabled })
		return {
			color: colorScen.color(5, color),
			background: disabled.value ? colorScen.bgColor(0, color) : colorScen.bgColor(-1, color),
		}
	})
}

Button.Style.propTypes = {
	size: propTypes.string.default(() => atom(undefined)),
	danger: propTypes.bool.default(() => atom(false)),
	primary: propTypes.bool.default(() => atom(false)),
}

export default createComponent(Button)
