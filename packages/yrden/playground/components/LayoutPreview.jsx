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

function LayoutPreview({ data }) {
  return (
    <container>
      {() => {
        const result = data.map((containerData) => {
          const style = atomComputed(() => {
            const rect = containerData.ref?.getBoundingClientRect() || {width: 0, height:0, top: 0, left: 0}
            return {
              content: containerData.node.component,
              position: 'absolute',
              width:rect.width,
              borderRadius: 6,
              height:rect.height,
              left:rect.left,
              top:rect.top,
              background: '#99dbff',
              boxSizing: 'border-box',
              border: '2px solid white'
            }
          })
          const key = `for-${containerData.node.id}-${containerData.vnodeId}`
          return <box data-key={key} inline style={style} key={key}/>
        })
        return result
      }}
    </container>
  )
}

LayoutPreview.propTypes = {
  data: propTypes.array.default(() => reactive([]))
}

export default LayoutPreview
