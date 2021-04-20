import scen from "../pattern";

export default function CustomRender(fragments) {
  fragments.cell.modify((result, {row, column, ...rest}) => {
    if (column.render) result.children = [column.render(row[column.dataIndex], row, rest)]
    Object.assign(result.attributes, {
      'inline-padding': scen().spacing()
    })
  })
}