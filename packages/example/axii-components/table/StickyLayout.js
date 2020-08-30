/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  propTypes,
  createElement,
  ref,
  reactive
} from 'axii'

export default function FeatureStickyLayout(fragments) {

  /**
   * TODO
   * 即要修改 collection。又要修改里面的 cell。
   * 并且里面的的改动，需要一个"上层作用域"的变量才行。
   *
   * 为什么很难改？是因为动态更新的这个节点，是根据一个函数计算出来，所以只能通过劫持的"计算过程"的方式来搞，
   * 才能保证每次节点更新，都把劫持的这个过程也算进去。
   * 不能通过计算完的结果进行操作。
   *
   * 1. 同时这个劫持过程，不在同一个作用域下，也很难形成作用域的继承关系，所以难以实现，是否能通过类似于 generator 的方式？？？
   * 例如
   * father(( childMutation ) => {
   *   let variable = 111
   *   renderChildren(function dynamicHijack() {
   *     // read variable
   *   })
   * })
   *
   * 2. 还有一种方式，在上层作用域声明一个变量容器(数组)。将 cell 中需要修改的部分都"使用引用"，把引用扔到容器里。
   * 最后再由上层作用域的 mutation 来批量修改这些引用。
   * 如果是这种方式，是否一开始就应该废除掉 fragment，全部使用 Component? 由框架来劫持 Component 的渲染。
   * 这样的话，参数不用显式声明。对子组件的修改也更容易理解？？？？
   *
   * 只是这样，controller 的改动就比较大，跟引擎耦合深。这件事情的本质是什么？
   */
  // TODO 移出去
  fragments.heads.argv.offsets = () => ({
    left: [],
    right: []
  })

  fragments.headCell.modify((result, { offsets, column }) => {
    if (column.fixed) {
      let offset = ref(0)

      if (column.fixed==='left') {
        offsets[column.fixed].push({ offset, width: column.width})
      }
      result.props['block-position-sticky'] = true
      result.props[`block-${column.fixed}`] = offset
    }
  })

  fragments.heads.modify((result, { columns, offsets }) => {
    let leftOffset = 0
    offsets.left.forEach(({ offset, width }) => {
      offset.value = leftOffset
      leftOffset += width
    })

    let rightOffset = 0
    offsets.right.reverse().forEach(({offset, width}) => {
      offset.value = rightOffset
      rightOffset += width
    })
  })

  // TODO 移出去
  fragments.cells.argv.offsets = () => ({
    left: [],
    right: []
  })

  fragments.cell.modify((result, { offsets, column }) => {
    if (column.fixed) {
      let offset = ref(0)

      if (column.fixed==='left') {
        offsets[column.fixed].push({ offset, width: column.width})
      }
      result.props['block-position-sticky'] = true
      result.props[`block-${column.fixed}`] = offset
    }
  })

  fragments.cells.modify((result, { offsets }) => {
    let leftOffset = 0
    offsets.left.forEach(({ offset, width }) => {
      offset.value = leftOffset
      leftOffset += width
    })

    let rightOffset = 0
    offsets.right.reverse().forEach(({offset, width}) => {
      offset.value = rightOffset
      rightOffset += width
    })
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
