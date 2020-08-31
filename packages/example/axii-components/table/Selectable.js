/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  propTypes,
  createElement,
  Fragment,
  refComputed,
} from 'axii';
import scen from '../pattern';
import { thStyle, tdStyle } from './Table';

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
  fragments.heads.modify((result, { data, selectedRowKeys }) => {
    const allSelected = refComputed(() => {
      return selectedRowKeys.size === data.length
    })
    result[0].children.unshift(<selectTh use="th" inline inline-display="table-cell" inline-border-width-1px block-width={60} rowSpan={result.length}><input type="checkbox" onClick={() => toggleAll(selectedRowKeys, data)} checked={allSelected}/></selectTh>)
  })


  fragments.cells.modify((result, { data, expandedRowRender, selectedRowKeys, row: rowData }) => {
    const selected = refComputed(() => {
      return selectedRowKeys.has(rowData.key)
    })
    result.unshift(<selectTd use="td" inline inline-display="table-cell"  inline-border-width-1px block-width={60}><input type="checkbox" onClick={() => toggleOne(selectedRowKeys, rowData.key)} checked={selected}/></selectTd>)
  })
}

FeatureSelectable.Style = (fragments) => {
  fragments.heads.elements.selectTh.style(thStyle)
  fragments.cells.elements.selectTd.style({
    ...tdStyle,
    textAlign: 'center',
    verticalAlign: 'middle'
  })
}

// 默认等于 match。
FeatureSelectable.propTypes = {
  selectedRowKeys: propTypes.array,
}
