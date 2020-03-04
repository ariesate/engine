import propTypes from '../../../controller-axii/src/propTypes';

export default function FeatureExpandable({ dataSource, expandedRowRender }, table) {
  const toggleExpandAll = () => {

  }

  const toggleExpandOne = (key) => {

  }

  // TODO 这里的 value 要做缓存计算怎么处理？应该用 computed 做？
  // TODO 可以直接把 expand 的具体实现写在这里。但是根节点要带上 name。
  table.thead.tr[0].td.unshift(<td index={table.expandAll}><expand value={} onChange={toggleExpandAll} /></td>)

  table.expandRows = []

  table.tbody.tr = table.tbody.tr.reduce((result, current) => {
    const rowData = current.props.data
    current.td.unshift(<td><expand value={} onChange={() => toggleExpandOne(rowData.key)}/></td>)
    result.push(current, <tr index={table.expandRows}>{expandedRowRender(rowData)}</tr>)
    return result
  }, [])

}

// 默认等于 match。
FeatureExpandable.propTypes = {
  expandedRowRender: propTypes.func
}


