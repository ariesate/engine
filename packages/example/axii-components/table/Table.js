/** @jsx createElement */
/** @jsxFrag Fragment */
import { createElement } from 'axii'
import wrap from '../wrap'
/**
 * // TODO
 * 1. 视窗
 *  1.1 翻页
 *  1.2 筛选
 *  1.3 过滤
 * 2. 编辑
 * 3. 表头分组
 * 4. 行列合并
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

export class TableDataSource {
  // 视窗 limit/offset/total
  // 排序 sort
  // 过滤 filter
}


export function Table( data, pagination, columns ) {

  return (
    <table>
      <thead>
        <th>
          {columns.map((column) => (
            <td data-column={column}>{column.title}</td>
          ))}
        </th>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr data={row}>
            {columns.map((column) => (
              <td data-column={column}>{data.get(column.dataIndex)}</td>
            ))}
          </tr>
        ))}
      </tbody>
      <pagination data={pagination}></pagination>
    </table>
  )

}

Table.methods = () => {

}

Table.Render = function() {

}


// 应该写成这个形式
export const WithFeature = Wrap(Table, [])


