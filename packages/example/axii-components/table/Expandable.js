/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  propTypes,
  createElement,
  Fragment,
  cloneElement,
  vnodeComputed
} from 'axii';
import { flatChildren } from '../wrap';

export default function FeatureExpandable({ dataSource, expandedRowRender, expandedRowKeys }, mutate, index) {
  const toggleExpandAll = () => {

  }

  const toggleExpandOne = (key) => {
    if (expandedRowKeys.has(key)) {
      expandedRowKeys.delete(key)
    } else {
      expandedRowKeys.add(key)
    }
  }

  // TODO 这里 block-width 是和 stickyLayout 的约定，要删掉
  mutate('heads', (result) => {
    result[0].children.unshift(<th block-width={60} rowSpan={result.length}><expand onChange={toggleExpandAll} /></th>)
  })

  mutate('rows', (result) => {
    result.forEach((tr, i) => {
      const rowData = tr.props.data
      // CAUTION 注意这里对 children 的 spread，不要随意打包，要小心地维护数据结构。
      result[i] = <>
        {tr}
        {vnodeComputed(() => expandedRowKeys.has(rowData.key) ?
          <tr><td colSpan={flatChildren(tr.children).length + 1}>{expandedRowRender(rowData)}</td></tr> :
          null)}
      </>
    })
  })

  // TODO 这里 block-width 是和 stickyLayout 的约定，要删掉
  mutate('cells', (result, rowData) => {
    result.unshift(<td block-width={60}><div onClick={() => toggleExpandOne(rowData.key)}>+</div></td>,)
  })

}


// 默认等于 match。
FeatureExpandable.propTypes = {
  expandedRowRender: propTypes.func,
  expandedRowKeys: propTypes.array,
}


