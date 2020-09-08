/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  propTypes,
  createElement,
  ref,
  reactive,
  computed
} from 'axii'

export default function FeatureStickyLayout(fragments) {

  fragments.root.prepare(({ columns }) => {
    const offsets = computed(() => {
      let leftOffset = 0
      let rightOffset = 0

      const left = new WeakMap()
      const right = new WeakMap()

      columns.forEach((column) => {
        const { fixed, width, dataIndex } = column
        if (!fixed) return
        if (!width) {
          console.warn(`fixed column ${dataIndex} must have width`)
          return
        }

        if (fixed === 'left') {
          left.set(column, leftOffset)
          leftOffset += width
        } else {
          right.set(column, rightOffset)
          rightOffset += width
        }
      })

      return { left, right }
    })

    return { offsets }
  })

  // 如果 column 上面有 left 标记，就修改一下 layout 样式实现 sticky.
  fragments.headCell.modify((result, { offsets, column }) => {
    if (!column.fixed) return
    result.props['block-position-sticky'] = true
    result.props[`block-${column.fixed}`] = offsets[column.fixed].get(column)
  })


  fragments.cell.modify((result, { offsets, column }) => {
    if (!column.fixed) return
    result.props['block-position-sticky'] = true
    result.props[`block-${column.fixed}`] = offsets[column.fixed].get(column)
  })


  fragments.root.modify((result, { columns, scroll }) => {
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
  })
}

FeatureStickyLayout.propTypes = {
  fixHeader: propTypes.bool.default(() => ref(false)),
  scroll: propTypes.object.default(() => reactive({})),
}

FeatureStickyLayout.match = () => true
