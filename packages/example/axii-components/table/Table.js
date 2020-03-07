/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  createElement,
  propTypes,
  reactive,
  refComputed,
  toRaw,
} from 'axii'
import wrap, { dynamic } from '../wrap'
import Expandable from './Expandable'
import Selectable from './Selectable'
import StickyLayout from './StickyLayout'
import { node } from '../../../engine/propTypes';
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

function reverseWalkChildren(nodes, level, handle) {
  let width = 0
  nodes.forEach(( node, i ) => {

    let currentWidth = 1
    if (node.children) {
      currentWidth = reverseWalkChildren(node.children, level + 1, handle)
      width += currentWidth
    }

    handle(node, level, currentWidth, i)
  })

  return width
}

function walkChildren(nodes, handle) {
  nodes.forEach(node => {
    handle(node)
    if (node.children) walkChildren(node.children, handle)
  })
}

function walkLeaf(nodes, handle) {
  nodes.forEach(node => {
    if (node.children) {
      walkLeaf(node.children, handle)
    } else {
      handle(node)
    }
  })
}

function makeKey(l, i) {
  return `${l}:${i}`
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

export function Table( { data, pagination, columns }, context, index) {

  return (
    <table block table-border-spacing-0 table-border-collapse-separate>
      <thead>
          {dynamic('heads', () => {
            index.headCells = new Set()

            let maxLevel = 0

            readByLevel(columns, 0, (column, level, childrenCount, levelIndex) => {
              if (level > maxLevel) maxLevel = level
            })

            const result = []

            readByLevel(columns, 0, (column, level, childrenCount, levelIndex) => {
              if (!result[level]) result[level] = <tr></tr>
              const colRowProps = {}
              colRowProps.colSpan = childrenCount
              if (!column.children) {
                colRowProps.rowSpan = maxLevel - level + 1
              }
              result[level].children.push(<th vnodeRef={v => index.headCells.add(v)} {...colRowProps} data-column={column}>{column.title}</th>)
            })

            return result
          })}
      </thead>
      <tbody>
        {dynamic('rows', () => {
          index.dataCells = new Set()
          index.prefixCells = new Map()

          return data.map((row) => (
            <tr data={row}>
              {dynamic('cells', () => {
                const cells = []

                walkLeaf(columns, (column) => {
                  cells.push(<td vnodeRef={v => index.dataCells.add(v)} data-column={column}>{row[column.dataIndex]}</td>)
                })
                return cells
              }, row)}
            </tr>
          ))
        })}
      </tbody>
      <pagination data={pagination}></pagination>
    </table>
  )

}

Table.methods = () => {

}

Table.Render = function() {

}

// TODO layout 中统一控制的部分怎么处理？？
Table.Style = (style) => {
  style.table.th = {
    borderRight: '1px #000 solid',
    borderBottom: '1px #000 solid',
    background: '#eee'
  }
  style.table.td = {
    borderRight: '1px #000 solid',
    borderBottom: '1px #000 solid',
    background: '#fff'
  }
}

Table.propTypes = {
  data: propTypes.array.default(() => reactive([])),
  columns: propTypes.array.default(() => reactive([]))
}

// 应该写成这个形式
export default wrap(Table, [Selectable, Expandable, StickyLayout])


