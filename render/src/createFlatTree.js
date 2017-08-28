import React from 'react'
import {
  PRIMITIVE_COMPONENTS,
  COMPONENT_TYPE_CUSTOM,
  COMPONENT_TYPE_IDENTIFIER,
  COMPONENT_TYPE_PRIMITIVE,
} from './constant'
import { ErrorUnknownComponentType } from './errors'
import { partial, mapValues, createUniqueIdGenerator } from './util'
import createPrimitiveWrapper from './createPrimitiveWrapper'

const createComponentKey = createUniqueIdGenerator('c')
const primitiveComponents = mapValues(PRIMITIVE_COMPONENTS, (display, tag) => createPrimitiveWrapper(tag, display))

function getComponentType(components, config) {
  const { type = 'div' } = config
  if (primitiveComponents[type] !== undefined) return [primitiveComponents[type], COMPONENT_TYPE_PRIMITIVE]
  if (components[type] !== undefined) return [components[type], COMPONENT_TYPE_CUSTOM]
  if (/\./.test(type)) {
    const [com, identifier] = type.split('.')
    if (components[com] !== undefined && components[com][identifier] !== undefined) {
      return [components[com][identifier], COMPONENT_TYPE_IDENTIFIER]
    }
  }

  throw new ErrorUnknownComponentType(type)
}

function ensureArray(obj) {
  if (!obj) return []
  if (Array.isArray(obj)) return obj

  throw new Error(`incompatible array value: ${obj}`)
}

export default function createFlatTree(components, parentComponentPath, config, index) {
  if (typeof config === 'string') return config
  const [Component, type] = getComponentType(components, config)
  const componentPath = parentComponentPath === undefined ? [] : parentComponentPath.concat(index)

  // identifier 只要 config.props
  const props = type === COMPONENT_TYPE_IDENTIFIER ?
    config.props :
    // 因为在 config 变化的情况下重用组件可能会导致位置问题，所以不如保证每个组件都是唯一的
  { ...config, path: componentPath, key: createComponentKey() }

  return (
    <Component {...props} >
      {ensureArray(config.children).map(partial(createFlatTree, components, componentPath))}
    </Component>
  )
}
