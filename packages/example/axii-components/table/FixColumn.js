/**
 * TODO
 * 1. fixHeader 和 fixColumn 的顺序问题
 * 2. 都要修改 colgroup
 *
 * 如果是要拆成3 个结构的话，就还要知晓 header。
 */

export default function FeatureFixColumn() {
  // TODO 是个建立索引的过程
  // 只要重拍就够了，应该写在这里。
  root.tbody.tr = (props, node) => {
    if (table.expandRows.includes(node)) return node

    // TODO 重新排列 children。
    // TODO 还要判断插在 selectable 之后。
    // TODO 还要判断 使用 lastResult 来判断 row 的类型
    // 对 sticky 的元素还要有样式处理。
    return <tr {...props}>
      {props.children}
    </tr>
  }
}

FeatureFixColumn.match = ({ columns }) => {
  // TODO 有一个 stick 就 match 了
}


