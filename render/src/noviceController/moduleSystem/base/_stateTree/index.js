import merge from 'lodash/merge'
import { createUniqueIdGenerator } from '../../../../util'
import createStateNode from './createStateNode'
import exist from '../../exist'

export function initialize(initialState, onChange) {
  const root = {}
  const generateBind = createUniqueIdGenerator('bind')

  return {
    initialize(cnode) {
      // TODO scope 要支持指定成上一级，比如有些布局组件，自己也有 state，但并不想把子组件数据也挂在自己下面
      // 约定 scope === 空数组时即为上一层
      const { bind = generateBind() } = cnode.props
      const parentStateNode = (cnode.parent && cnode.parent.stateNode) ? cnode.parent.stateNode : root

      // TODO initialState 没用到
      const rawValue = exist.get(parentStateNode, bind, {})
      const { getDefaultState = () => ({}) } = cnode.type
      const initialStateNodeValue = merge(getDefaultState(), rawValue)
      const stateNode = createStateNode(initialStateNodeValue, () => onChange([cnode]))
      // CAUTION 这里有副作用
      cnode.stateNode = stateNode
      exist.set(parentStateNode, bind, stateNode)
    },
    getState() {
      return root
    },
    destroy(cnode) {
      if (!cnode.parent) {
        delete root[cnode.props.bind]
      }
    },
  }
}
