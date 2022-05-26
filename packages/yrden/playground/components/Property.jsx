/**@jsx createElement*/
/**@jsxFrag Fragment*/
import {
  createElement,
  Fragment,
  computed,
  reactive,
  propTypes,
  watch,
  createComponent,
  atomComputed,
  delegateLeaf,
  tryToRaw,
} from 'axii'
import * as axiiComponents from 'axii-components'
import { SCHEMA_NODE_INDEX_STATE_NAME, SCHEMA_NODE_ID_STATE_NAME } from "yrden";

const RESERVED_NAMES = [SCHEMA_NODE_INDEX_STATE_NAME, SCHEMA_NODE_ID_STATE_NAME, 'children']

// 这里编辑的是写死到 data.props 上的数据。
export default function Property({ data, components }) {

  const Component = atomComputed(() => components[data.value?.component])

  const propTypeEditors = [
    [
      propTypes.string,
      axiiComponents.Input
    ]
  ]


  return <container>
    {function () {
      return Component.value?.propTypes ?
        Object.entries(Component.value.propTypes).map(([propName, propType]) => () => {
          if (RESERVED_NAMES.includes(propName)) return null
          const Editor = propTypeEditors.find(([type]) => propType.is(type))?.[1]
          // TODO 有就用，没有就用 default
          //  理论上传进来的都应该有值了，在外面就应该给它加上。
          //  这里是 prop 上的值，应该要读 stateTree 上的初始值。
          const propValue = delegateLeaf(data.value.props || {})[propName]

          return (
            <property block>
              <propName inline>{propName}</propName>
              <propValue>{Editor ? <Editor value={propValue}/> : null}</propValue>
            </property>
          )
        }) :
        null
    }
    }
  </container>
}
