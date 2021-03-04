/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  createElement,
  propTypes,
  ref
} from 'axii';
import * as icons from '@ant-design/icons-svg'
import { renderIconDefinitionToSVGElement } from '@ant-design/icons-svg/es/helpers';

function createAXIIElement({tag, attrs, children = []}) {
  return createElement(tag, { ...attrs, isSVG: true }, children.map(createAXIIElement))
}

function transName(type, theme) {
  return `${type.value[0].toUpperCase()}${type.value.slice(1)}${theme.value[0].toUpperCase()}${theme.value.slice(1)}`
}

export default function Icon({ type, size, unit, color, theme }) {

  const iconDef = icons[transName(type, theme)]
  if (!iconDef) {
    console.error(`unknown icon ${transName(type, theme)}`)
    return null
  }

  return createAXIIElement({
    ...iconDef.icon,
    attrs: {
      ...iconDef.icon.attrs,
      width: `${size.value}${unit.value}`,
      height: `${size.value}${unit.value}`,
      fill: color.value,
    }
  })
}

Icon.propTypes = {
  type: propTypes.string.default(() => ref('')),
  size: propTypes.number.default(() => ref(14)),
  unit: propTypes.string.default(() => ref('px')),
  theme: propTypes.string.default(() => ref('outlined')),
}
