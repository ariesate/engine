import {createElement, Fragment} from 'axii'
import {useMDXComponents} from './context'

const TYPE_PROP_NAME = 'mdxType'

const DEFAULTS = {
  inlineCode: 'code',
  wrapper: (props) => {
    return createElement(Fragment, {}, ...props.children)
  }
}

const MDXCreateElement = (props) => {
  const {
    components: propComponents,
    mdxType,
    originalType,
    parentName,
    children = [],
    ...etc
  } = props

  const components = useMDXComponents(propComponents)
  const type = mdxType
  const Component =
    components[`${parentName}.${type}`] ||
    components[type] ||
    DEFAULTS[type] ||
    originalType

  /* istanbul ignore if - To do: what is this useful for? */
  if (propComponents) {
    return createElement(Component, {
      ...etc,
      components: propComponents
    }, ...children)
  }

  return createElement(Component, {...etc}, ...children)
}

MDXCreateElement.displayName = 'MDXCreateElement'

// CAUTION 一定要能把 propChildren 去掉， axii 中会默认使用 propChildren 去覆盖 children
function mdx(type, props, ...children ) {
  const mdxType = props && props.mdxType

  if (typeof type === 'string' || mdxType) {
    const newProps = {}
    for (let key in props) {
      /* istanbul ignore else - folks putting stuff in `prototype`. */
      if (hasOwnProperty.call(props, key) && key !== 'children') {
        newProps[key] = props[key]
      }
    }
    newProps.originalType = type
    newProps[TYPE_PROP_NAME] = typeof type === 'string' ? type : mdxType

    return createElement(MDXCreateElement, newProps, ...children)
  }

  return createElement(type, props, ...children)
}

mdx.Fragment = Fragment

export default mdx
