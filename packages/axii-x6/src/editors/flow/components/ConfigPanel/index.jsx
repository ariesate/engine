/** @jsx createElement */
import { createElement, useViewEffect, propTypes, atom, debounceComputed } from 'axii'
import ConfigNode from './ConfigNode.jsx'
import ConfigGrid from './ConfigGrid.jsx'
import styles from './index.less'


export default function ConfigPanel({ graph, node }) {
  return (
    <div className={styles.config}>
      {() => node.value ? <ConfigNode graph={graph} node={node.value} /> : <ConfigGrid graph={graph} />}
    </div>
  )
}

ConfigPanel.propTypes = {
  node: propTypes.object.default(() => atom()),
}
