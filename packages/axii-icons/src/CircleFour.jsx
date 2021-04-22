import Icon from '@icon-park/svg/es/icons/CircleFour.js';
/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  createElement,
  propTypes,
  atomComputed,
  atom
} from 'axii';

export default function IconPark({ wrapper, size, unit, theme, fill, strokeLinecap, strokeLinejoin, strokeWidth, ...rest }) {
  const iconStr = atomComputed(() => ({
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
  size: propTypes.number.default(() => atom(1)),
  unit: propTypes.string.default(() => atom('em')),
  // theme: outline filled two-tone multi-color
  theme: propTypes.string.default(() => atom('outline')),
  fill: propTypes.string.default(() => atom('#333')),
  //'butt' | 'round' | 'square'
  strokeLinecap: propTypes.string.default(() => atom('round')),
  // 'miter' | 'round' | 'bevel'
  strokeLinejoin: propTypes.string.default(() => atom('round')),
  strokeWidth: propTypes.number.default(() => atom(4)),
  wrapper: propTypes.string.default(() => atom('iconWrapper')),
}
