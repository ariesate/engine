/** @jsx createElement */
import { createElement, useViewEffect, propTypes, ref, debounceComputed } from 'axii'
import ConfigEntity from './ConfigEntity.tsx'
import ConfigGrid from './ConfigGrid.tsx'
import styles from './index.less'


export default function ConfigPanel({ graph, entity }) {
  return (
    <div className={styles.config}>
      {() => entity.value ? <ConfigEntity graph={graph} entity={entity.value} /> : <ConfigGrid graph={graph} />}
    </div>
  )
}

ConfigPanel.propTypes = {
  node: propTypes.object.default(() => ref()),
}
