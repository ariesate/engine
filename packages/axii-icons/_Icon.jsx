/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  createElement,
  propTypes,
  refComputed,
  ref
} from 'axii';
import * as icons from '@ant-design/icons-svg'

function createAXIIElement({tag, attrs, children = []}) {
  return createElement(tag, { ...attrs, isSVG: true }, children.map(createAXIIElement))
}

function transName(type, theme) {
  return `${type.value[0].toUpperCase()}${type.value.slice(1)}${theme.value[0].toUpperCase()}${theme.value.slice(1)}`
}

export default function Icon({ type, size, unit, color, theme }) {

  const iconDef = refComputed(() => icons[transName(type, theme)])
  if (!iconDef.value) {
    console.error(`unknown icon ${transName(type, theme)}`)
    return null
  }

  return <i>
    {() => createAXIIElement({
      ...iconDef.value.icon,
      attrs: {
        ...iconDef.value.icon.attrs,
        width: `${size.value}${unit.value}`,
        height: `${size.value}${unit.value}`,
        fill: color.value,
      }
    })}
  </i>
}

Icon.propTypes = {
  type: propTypes.string.default(() => ref('')),
  size: propTypes.number.default(() => ref(14)),
  unit: propTypes.string.default(() => ref('px')),
  theme: propTypes.string.default(() => ref('outlined')),
  color: propTypes.string.default(() => ref('#333')),
}
