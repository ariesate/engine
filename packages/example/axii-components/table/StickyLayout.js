/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  propTypes,
  vnodeComputed,
  createElement,
  Fragment,
  ref,
  reactive
} from 'axii'

export default function FeatureStickyLayout({ columns }, mutate, index) {

  mutate('heads', (result) => {

    const left = []
    const right = []

    // 只读第一行的
    result[0].children.forEach((th) => {
      if (index.headCells.has(th)) {
        const column = th.props['data-column']

        if (column.fixed) {
          if (column.children) {
            console.warn('fixed column can not have children')
            return
          }

          if (!column.width) {
            console.warn('fixed column must have width')
            return
          }

          if (column.fixed === 'left') {
            left.push(th)
          } else {
            right.push(th)
          }
        }
      } else {
        left.push(th)
        // 其他

      }
    })

    let leftOffset = 0
    left.forEach((th) => {
      th.props.block = true
      th.props['block-position-sticky'] = true
      th.props['block-left'] = leftOffset
      leftOffset += index.headCells.has(th) ? th.props['data-column'].width : th.props['block-width']
    })

    let rightOffset = 0
    right.reverse().forEach((th) => {
      th.props.block = true
      th.props['block-position-sticky'] = true
      th.props['block-right'] = rightOffset
      rightOffset += index.headCells.has(th) ? th.props['data-column'].width : th.props['block-width']
    })

  })

  mutate('cells', (result, row) => {
    // 重新排列, 1, 功能性column 如 select checkbox。 2, stick left ...
    const left = []
    const right = []
    const middle = []
    const noDataLeft = []
    const noDataRight = []

    let dataColumnFound = false

    // TODO 给警告，不需要 reorder。因为和分组表头结合的时候，无法自动排到左右，用用户自己确定才行。
    result.forEach(cell => {
      if (index.dataCells.has(cell)) {
        dataColumnFound = true
        const column = cell.props['data-column']

        if (column.fixed === 'left') {
          left.push(cell)
        } else if (column.fixed === 'right') {
          right.push(cell)
        } else {
          middle.push(cell)
        }
      } else {
        if (!dataColumnFound) {
          // 前缀的。
          noDataLeft.push(cell)
        } else {
          // 后面缀
          noDataRight.push(cell)
        }
      }
    })

    let leftOffset = 0
    noDataLeft.concat(left).forEach(cell => {
      cell.props.block = true
      cell.props['block-position-sticky'] = true
      cell.props['block-left'] = leftOffset
      leftOffset += cell.props['block-width']
    })

    let rightOffset = 0
    right.concat(noDataRight).reverse().forEach(cell=>{
      cell.props.block = true
      cell.props['block-position-sticky'] = true
      cell.props['block-right'] = rightOffset
      rightOffset += cell.props['block-width']
    })

    result.splice(0, result.length, ...noDataLeft, ...left, ...middle, ...right, ...noDataRight)
  })
}

FeatureStickyLayout.propTypes = {
  fixHeader: propTypes.bool.default(() => ref(false)),
  scroll: propTypes.object.default(() => reactive({})),
}


FeatureStickyLayout.match = () => true


FeatureStickyLayout.Render = ({ columns, scroll }, result, originResult, index) => {
  // table layout
  result.props['block'] = true
  result.props['table-layout-fixed'] = true
  result.props['block-width'] = scroll.x

  // TODO fix 中的样式有非常负责的怎么处理，例如fix 的时候需要有 boxshadow是通过 after 实现的
  // TODO 还要参数来控制这个 after。
  return (
    <div
      block
      block-overflow-x-scroll
      block-overflow-y-scroll
      block-max-height={scroll.y}
    >
      {result}
    </div>
  )
}


