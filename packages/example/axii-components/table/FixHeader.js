/**
 * TODO
 * 1. fixHeader 需要改变 table/header/body 的实现，这怎么表达 merge。
 * 2. 如果这个 partial 也要对节点进行命名，然后用样式控制，怎么和外部的命名合并？
 * 3. 要修正 header 和 body 的宽度问题，还需要得到 colgroup。这算是什么概念？？？怎么暴露 colgroup
 */

export default function FeatureFixHeader() {

}

// TODO root 没法赋值啊！！！
FeatureFixHeader.Render = ({}, structure ) => {
  structure.table = (props) => {
    return <div>{props.children}</div>
  }

  structure.table.thead = ((props) => {
    return <table><thead>{props.children}</thead></table>
  })

  structure.table.tbody = ((props) => {
    return <table><tbody>{props.children}</tbody></table>
  })
}