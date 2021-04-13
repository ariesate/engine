import Icon from '@icon-park/svg/es/icons/EndTimeSort.js';
/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  createElement,
  propTypes,
  refComputed,
  ref
} from 'axii';

export default function IconPark({ wrapper, size, unit, theme, fill, strokeLinecap, strokeLinejoin, strokeWidth, ...rest }) {
  const iconStr = refComputed(() => ({
    __html: Icon({
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
