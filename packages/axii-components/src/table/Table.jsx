/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  createElement,
  propTypes,
  reactive,
  createComponent,
  ref
} from 'axii'
import Expandable from './Expandable'
import Selectable from './Selectable'
import StickyLayout from './StickyLayout'

import scen from '../pattern'
/**
 * // TODO
 * 1. 视窗
 *  1.1 翻页
 *  1.2 筛选
 *  1.3 过滤
 * 2. 编辑
 * 4. 行列合并
 * 5. refComputed
 */

/**
 * feature 体系，改结构的问题：
 * 1. 只能以 fragment 的方式扩展(selectable/expandable)
 * 2. 或者以 overwrite 的方式来拓展实现
 *
 * 改位置 box 信息？
 * 1. TODO 只要当前结构允许，就可以???fix column 怎么实现？
 *
 * 应该有一种范式，不管组件是什么样的，在这个范式下，改布局，改结构就能实现。
 * TODO 改结构、改位置的需求也可以继续探索本质？？？
 * 1. 我们的数据结构只有树形，进行渲染的逻辑也只有树形。
 * 2. 通过树形来渲染应该是一种领域知识。
 * 3. fixHeader 的 overwrite 没有破坏树形渲染的过程
 * 4. fixColumn 破坏了，因为本来没有 column 这样一个连接，只有 row。
 *
 * 5. 处分 table 把每个部分都虚拟化。才能实现对 column 的控制。
 */


function walkLeaf(nodes, handle) {
  nodes.forEach(node => {
    if (node.children) {
      walkLeaf(node.children, handle)
    } else {
      handle(node)
    }
  })
}


function readByLevel(nodes, level, handle) {
  let levelIndex = 0
  return nodes.map((node) => {
    let currentWidth = 1
    if (node.children) {
      currentWidth = readByLevel(node.children, level+1, handle).reduce((r, c) => r + c , 0)
    }
    handle(node, level, currentWidth, levelIndex)
    levelIndex += currentWidth

    return currentWidth
  })
}

function countExpandedColumns(columns) {
  return readByLevel(columns, 0, () => {}).reduce((a, b) => a+b, 0)
}

export function Table( { data, pagination, columns }, fragments) {
  const columnCount = ref(countExpandedColumns(columns))
  return (
    <table inline block-display-table table-border-spacing-0 table-border-collapse-collapse>
      <thead>
          {fragments.heads({ columnCount })(() => {

            let maxLevel = 0

            readByLevel(columns, 0, (column, level) => {
              if (level > maxLevel) maxLevel = level
            })

            const result = []

            readByLevel(columns, 0, (column, level, childrenCount) => {
              if (!result[level]) result[level] = <tr></tr>
              const colRowProps = {}
              colRowProps.colSpan = childrenCount
              if (!column.children) {
                colRowProps.rowSpan = maxLevel - level + 1
              }
              result[level].children.push(fragments.headCell({column, level, childrenCount})(() => (
                <th inline inline-display="table-cell" inline-border-width-1px  {...colRowProps}>{column.title}</th>
              )))
            })

            return result
          })}
      </thead>
      <tbody>
        {fragments.rows({ columnCount })(() => {
          return data.map((row) => (
            fragments.row({ row })(() => (
              <tr data={row}>
                {fragments.cells({row})(() => {
                  const cells = []
                  walkLeaf(columns, (column) => {
                    cells.push(fragments.cell({ column })(() => <td inline inline-display="table-cell"  inline-border-width-1px >{row[column.dataIndex]}</td>))
                  })
                  return cells
                })}
              </tr>
            ))
          ))
        })}
      </tbody>
      <pagination data={pagination}></pagination>
    </table>
  )
}


// TODO layout 中统一控制的部分怎么处理？？
export const thStyle = {
  borderColor: scen().separateColor(),
  borderStyle: 'solid',
  background: scen().fieldColor()
}

export const tdStyle = {
  borderStyle: 'solid',
  borderColor: scen().separateColor(),
  background: '#fff'
}

Table.Style = (fragments) => {
  fragments.headCell.elements.th.style(thStyle)
  fragments.cell.elements.td.style(tdStyle)

}

Table.propTypes = {
  data: propTypes.array.default(() => reactive([])),
  columns: propTypes.array.default(() => reactive([]))
}

// 应该写成这个形式
export default createComponent(Table, [StickyLayout, Selectable, Expandable])


