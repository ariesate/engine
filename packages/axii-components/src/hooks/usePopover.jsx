/** @jsx createElement */
import { createElement, render, reactive, atomComputed, atom } from 'axii'
import useLayer from './useLayer.jsx'
import layerStyle  from '../style/layer'

export default function usePopover(content, position = 'bottom', align='left') {

	const visible = atom(false)

	const getContainerRect = ({top, left, height, width}) => {
		const positionStyle = position === 'bottom' ? { top: height + top } :
			position === 'top' ? { bottom: top } :
				position === 'left' ? { right: left} :
					{ left: left + width}

		const alignStyle = align === 'left' ? { left } :
			align === 'right' ? { right: left + width } :
				align === 'top' ? { top } :
					{ bottom: top + height}

		return {
			...positionStyle,
			...alignStyle
		}
	}

	const style = atomComputed(() => ({
		whiteSpace: 'nowrap',
		...layerStyle
	}))

	const layerReturn = useLayer(<dropdown style={style}>
		{content}
	</dropdown>, {
		getContainerRect,
		visible
	})

	return {
		...layerReturn,
		visible
	}
}
