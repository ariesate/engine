/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  createElement,
} from 'axii';
import * as icons from '@ant-design/icons-svg'
import { renderIconDefinitionToSVGElement } from '@ant-design/icons-svg/es/helpers';

function createAXIIElement({tag, attrs, children = []}) {
  return createElement(tag, { ...attrs, isSVG: true }, children.map(createAXIIElement))
}

function transName(type, theme) {
  return `${type[0].toUpperCase()}${type.slice(1)}${theme[0].toUpperCase()}${theme.slice(1)}`
}

export default function Icon({ type, size=14, unit='px', color='#000', theme='outlined' }) {
  const iconDef = icons[transName(type, theme)]

  return createAXIIElement({
    ...iconDef.icon,
    attrs: {
      ...iconDef.icon.attrs,
      width: `${size}${unit}`,
      height: `${size}${unit}`,
      fill: color
    }
  })

}
