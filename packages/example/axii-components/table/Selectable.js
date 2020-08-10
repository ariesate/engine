/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  propTypes,
  createElement,
  Fragment,
  refComputed,
} from 'axii';

export default function FeatureSelectable(fragments) {
  const toggleAll = (selectedRowKeys, data) => {
    if (selectedRowKeys.size === data.length) {
      selectedRowKeys.clear()
    } else {
      data.forEach(d => {
        selectedRowKeys.add(d.key)
      })
    }
  }

  const toggleOne = (selectedRowKeys, key) => {
    if (selectedRowKeys.has(key)) {
      selectedRowKeys.delete(key)
    } else {
      selectedRowKeys.add(key)
    }
  }

  // TODO 这里 block-width 是和 stickyLayout 的约定，要删掉
  fragments.heads.mutations = ({ data, expandedRowRender, selectedRowKeys }, result) => {
    const allSelected = refComputed(() => {
      return selectedRowKeys.size === data.length
    })
    result[0].children.unshift(<th block-width={60} rowSpan={result.length}><input type="checkbox" onClick={() => toggleAll(selectedRowKeys, data)} checked={allSelected}/></th>)
  }


  fragments.cells.mutations = ({ data, expandedRowRender, selectedRowKeys }, result, {row: rowData }) => {
    const selected = refComputed(() => {
      return selectedRowKeys.has(rowData.key)
    })
    result.unshift(<td block-width={60}><input type="checkbox" onClick={() => toggleOne(selectedRowKeys, rowData.key)} checked={selected}/></td>)
  }
}

// 默认等于 match。
FeatureSelectable.propTypes = {
  selectedRowKeys: propTypes.array,
}
