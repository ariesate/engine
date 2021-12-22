/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  createElement,
  propTypes,
  reactive,
  createComponent,
  atom
} from 'axii'
import Expandable from './Expandable'
import Selectable from './Selectable'
import StickyLayout from './StickyLayout'
import CustomRender from './CustomRender'

import scen from '../pattern'

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
  const columnCount = atom(countExpandedColumns(columns))
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
              <tr>
                {fragments.cells({row})(() => {
                  const cells = []
                  walkLeaf(columns, (column) => {
                    cells.push(fragments.cell({ column })(() => <td inline inline-display="table-cell" inline-border-width-1px>{row[column.dataIndex]}</td>))
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

export const thStyle = {
  borderColor: scen().separateColor(),
  borderStyle: 'solid',
  background: scen().fieldColor(),
  padding: scen().spacing()
}

export const tdStyle = {
  borderStyle: 'solid',
  borderColor: scen().separateColor(),
  background: scen().active().bgColor(),
  padding: scen().spacing()
}

Table.Style = (fragments) => {
  fragments.headCell.elements.th.style(thStyle)
  fragments.cell.elements.td.style(tdStyle)
}

Table.propTypes = {
  data: propTypes.array.default(() => reactive([])),
  columns: propTypes.array.default(() => reactive([]))
}

export default createComponent(Table, [StickyLayout, Selectable, Expandable, CustomRender])


