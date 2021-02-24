/** @jsx createElement */
import { createElement, useViewEffect, propTypes, ref, debounceComputed } from 'axii'
import ConfigNode from './ConfigNode.tsx'
import ConfigGrid from './ConfigGrid.tsx'
import styles from './index.less'


export default function ConfigPanel({ graph, node }) {
  return (
    <div className={styles.config}>
      {() => node.value ? <ConfigNode graph={graph} node={node.value} /> : <ConfigGrid graph={graph} />}
    </div>
  )
}

ConfigPanel.propTypes = {
  node: propTypes.object.default(() => ref()),
}
