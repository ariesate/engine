/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  propTypes,
  createElement,
  Fragment,
  cloneElement,
  vnodeComputed,
  flattenChildren
} from 'axii';
import { Table, tdStyle, thStyle } from './Table'

export default function FeatureExpandable(fragments) {
  const toggleExpandAll = () => {

  }

  const toggleExpandOne = (expandedRowKeys, key) => {
    if (expandedRowKeys.has(key)) {
      expandedRowKeys.delete(key)
    } else {
      expandedRowKeys.add(key)
    }
  }

  fragments.rows.modify((result, { columnCount })=> {
    columnCount.value += 1
  })

  // TODO 这里 block-width 是和 stickyLayout 的约定，要删掉
  fragments.heads.modify((result, { expandedRowKeys }) => {
    result[0].children.unshift(<expandTh use="th" block-width={60} rowSpan={result.length}><expand onChange={() => toggleExpandAll(expandedRowKeys)} /></expandTh>)
  })

  // TODO 这里 block-width 是和 stickyLayout 的约定，要删掉
  fragments.cells.modify((result, { expandedRowKeys, row: rowData }) => {
    result.unshift(<expandTd inline inline-display="table-cell"  inline-border-width-1px use="td" block-width={60}>
      <div onClick={() => toggleExpandOne(expandedRowKeys, rowData.key)}>
        {expandedRowKeys.has(rowData.key) ? '-' : '+'}
      </div>
    </expandTd>,)
  })

  fragments.row.modify((resultTr, { row: rowData, expandedRowRender, expandedRowKeys, columnCount }) => {

    return <>
      {resultTr}
      {
        fragments.expandedRow()(() => {
          // TODO 这里的这个 flattenChildren 是怎么读出来的呢？必须确保自己在所有可能插入列的 feature 之后再执行？
          // 在 row 那一层的时候 resultTr 还没有解析完，但是到这里的时候就已经解析完了。 但这里没有解决 expandable 只能放 features 最后的问题。
          return expandedRowKeys.has(rowData.key) ?
            <tr>
              <expandedTd use="td" inline inline-display="table-cell" inline-border-width-1px
                          colSpan={columnCount}>
                {expandedRowRender(rowData)}
              </expandedTd>
            </tr> :
            null
        })
      }
    </>
  })

}


// 默认等于 match。
FeatureExpandable.propTypes = {
  expandedRowRender: propTypes.func,
  expandedRowKeys: propTypes.array,
}

FeatureExpandable.Style = (fragments) => {
  fragments.heads.elements.expandTh.style(thStyle)
  fragments.cells.elements.expandTd.style({
    ...tdStyle,
    textAlign: 'center',
    verticalAlign: 'middle'
  })
  fragments.expandedRow.elements.expandedTd.style({
    ...tdStyle,
    overflowX : 'auto',
  })

}

