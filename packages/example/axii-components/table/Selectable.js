/**
 * TODO
 * 0. 需要存在数据之上的 state 怎么办？只能另外建立？selected/expanded
 *
 * 1. 劫持的部分怎么拿到当前的上下文, 由外部主动提供。
 *
 * 2. 改写的部分重要继续交给系统的结构是用 Cell 的形式还是 cell？
 *
 * ANSWER
 * 3. 全选计算的缓存问题，virtual list 怎么办？这是个业务问题。
 * selectable 知晓 virtual list。因为那是视窗问题。
 *
 * 4. 如何扩展领域模型的问题。
 * feature 完全知晓 base 。
 *
 * 5. 和 expandable 放在一起时的顺序问题。
 * feature 是一种组织代码的形式，并不是能完全处理未知的情况，所以顺序应该在胶水成是知晓的。
 *
 */

export default function FeatureSelectable({ dataSource, selected }, table, { unselect, select }) {
  // 对领域模型的扩展

  const checkboxOnChange = (id) => selected.includes(id) ?
    unselect(id) :
    select(id)

  const toggleAll = () => {

  }

  // TODO 这里的 value 要做缓存计算怎么处理？应该用 computed 做？
  // TODO 可以直接把 checkbox 的具体实现写在这里。但是根节点要带上 name。
  table.thead.tr[0].td.unshift(<td index={table.selectedAll} ><checkbox value={} onChange={toggleAll} /></td>)

  table.selectOne = []
  table.tbody.tr.forEach((row) => {
    row.children.unshift(
      <td index={table.selectOne}><checkbox value={} onChange={() => checkboxOnChange(row.key)}></checkbox></td>
    )
  })
}

FeatureSelectable.Render = ({}, table ) => {
  table.selectedAll.checkbox = (props) => <input type="checkbox" {...props} />
  table.selectOne.checkbox = (props) => <input type="checkbox" {...props} />
}

// TODO 这不是和事件回调的写法重复了吗？推荐用这种写法，最后还是翻译成回调的样子。
FeatureSelectable.methods = {
  select({ selected, }, id ) {
    selected.add(id)
  },
  unselect({ selected }, id ) {
    selected.remove(id)
  },
  selectAll() {

  },
  unselectAll() {

  }
}

// CAUTION  默认有声明的 Prop，就 match 了。
// FeatureSelectable.match = {
//   selected : true
// }

// CAUTION 要扩展的 prop 字段
FeatureSelectable.propTypes = {
  selected: propTypes.set.defaultValue(() => [])
}
