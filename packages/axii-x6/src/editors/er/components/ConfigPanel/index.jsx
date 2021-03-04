/** @jsx createElement */
import { createElement, useViewEffect, propTypes, ref, debounceComputed, reactive } from 'axii'
import ConfigEntity from './ConfigEntity.jsx'
import ConfigRelation from './ConfigRelation.jsx'
import ConfigGrid from './ConfigGrid.jsx'
import styles from './index.less'


export default function ConfigPanel({ graph, type, item, customFields }) {
  console.log("rerender", item)
  return (
    <div className={styles.config}>
      {() => type.value === 'graph' ? <ConfigGrid graph={graph} /> : null}
      {() => type.value === 'entity' ? <ConfigEntity entity={item} graph={graph} customFields={customFields}/> : null}
      {() => type.value === 'relation' ? <ConfigRelation relation={item} graph={graph} customFields={customFields}/> : null}
    </div>
  )
}

ConfigPanel.propTypes = {
  node: propTypes.object.default(() => ref()),
  type: propTypes.object.default(() => ref('')),
  item: propTypes.object.default(() => reactive({})),
  customFields: propTypes.object.default(() => reactive([])),
}
