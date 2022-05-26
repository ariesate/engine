import { propTypes } from 'axii'
import { render } from './render'
import {deepClone, walkSchema} from "../util";


function stringifyPath(path) {
  return path.join('_')
}

function parsePathStr(pathStr) {
  return pathStr.split('_')
}

export function schemaToComponent(inputSchema, components, displayName = 'Custom') {
  // 1. walkSchema，收集所有有名字的组件。

  const namedNodes = []

  walkSchema(inputSchema, components, (node, path, context) => {
    if (node.component && node.exportName) {

      const Component = components[node.component]
      const namePath = context.concat(node.exportName)
      namedNodes.push({ node, namePath, propTypes: Component.propTypes })
      return namePath
    }
  }, [])

  function Component({ children: inputChildren, ...flatProps }) {
    const children = inputChildren.isChildren ? inputChildren.raw : inputChildren
    // 每个 Component 都单独复制一份，防止一个页面上有多个该组件时数据污染了。
    const schema = deepClone(inputSchema)
    const propsByComponent = Object.entries(flatProps).reduce((result, [flatPropName, prop]) => {
      const propPath = parsePathStr(flatPropName)
      const propName = propPath.at(-1)
      const componentPath = stringifyPath(propPath.slice(0, propPath.length -1))
      if (!result[componentPath]) result[componentPath] = {}
      Object.assign(result[componentPath], {[propName] : prop})

      return result
    }, {})

    console.log(schema)
    // 根据 props 上的路径信息，把相应的值 attach 到 schema 上
    walkSchema(schema, components, (node, path, context) => {

      if (node.component && node.exportName) {
        const currentPathContext = context.concat(node.exportName)
        const pathStr = stringifyPath(currentPathContext)
        const nodeProps = propsByComponent[pathStr]

        if (nodeProps) {
          // props 是合并，因为可以有些固有的
          if (!node.props) node.props = {}
          Object.assign(node.props, nodeProps)
        }

        // TODO children 如果是 shapeOf 应该深度 merge
        if (children?.[pathStr]) {
          const isArrayChildren = Array.isArray(children[pathStr])
          if (!node.children) node.children = isArrayChildren ? [] : {}

          if (isArrayChildren) {
            node.children = children[pathStr]
          } else {
            Object.assign(node.children, children[pathStr])
          }
        }
        return currentPathContext
      }
    }, [])

    console.log(111, schema)

    return render(schema, components)
  }

  Component.propTypes = {}

  let childrenShape = null
  namedNodes.forEach(({propTypes: nodePropTypes, namePath, node}) => {

    const { children: childrenPropTypes, ...dataPropTypes } = nodePropTypes

    Object.entries(dataPropTypes).forEach(([propName, propType]) => {
      Component.propTypes[stringifyPath(namePath.concat(propName))] = propType
    })


    if (childrenPropTypes) {
      if (!childrenShape) childrenShape = {}
      // CAUTION 注意这里如果 children 也是 shapeOf 的话，直接拿里面的定义就好了，因为 shapeOf 本来就可以是深度树形。
      childrenShape[stringifyPath(namePath)] = childrenPropTypes.is(propTypes.shapeOf) ? childrenPropTypes.argv[0] : childrenPropTypes
    }
  }, {})

  if (childrenShape) Component.propTypes.children = propTypes.shapeOf(childrenShape)


  Component.displayName = displayName

  return Component
}

