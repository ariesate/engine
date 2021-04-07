/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  createElement,
  propTypes,
  refComputed,
  ref
} from 'axii';
import * as Icons from '@icon-park/svg'

export default function IconPark({ wrapper, type, size, unit, theme, fill, strokeLinecap, strokeLinejoin, strokeWidth, ...rest }) {
  const iconStr = refComputed(() => ({
    __html: Icons[type.value]({
      theme: theme.value,
      size: `${size.value}${unit.value}`,
      fill: fill.value,
      strokeLinecap: strokeLinecap.value,
      strokeLinejoin: strokeLinejoin.value,
      strokeWidth: strokeWidth.value,
    })
  }))

  return createElement(wrapper.value, {dangerouslySetInnerHTML: iconStr, ...rest, inline: true, 'inline-line-height-1': true})
}

IconPark.propTypes = {
  type: propTypes.string.default(() => ref('')),
  size: propTypes.number.default(() => ref(1)),
  unit: propTypes.string.default(() => ref('em')),
  // theme: outline filled two-tone multi-color
  theme: propTypes.string.default(() => ref('outline')),
  fill: propTypes.string.default(() => ref('#333')),
  //'butt' | 'round' | 'square'
  strokeLinecap: propTypes.string.default(() => ref('round')),
  // 'miter' | 'round' | 'bevel'
  strokeLinejoin: propTypes.string.default(() => ref('round')),
  strokeWidth: propTypes.number.default(() => ref(4)),
  wrapper: propTypes.string.default(() => ref('iconWrapper')),
}
