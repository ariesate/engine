import { createUniqueIdGenerator } from '../../util'
import createStateNode from './createStateNode'
import exist from './exist'


export default function publicCreateStateTree(initialState, onChange) {
  const root = {}
  const generateBind = createUniqueIdGenerator('bind')

  return {
    initialize(cnode) {
      // TODO scope 要支持指定成上一级，比如有些布局组件，自己也有 state，但并不想把子组件数据也挂在自己下面
      // 约定 scope === 空数组时即为上一层
      const { bind = generateBind() } = cnode.props
      const parentStateNode = (cnode.parent && cnode.parent.stateNode) ? cnode.parent.stateNode : root

      // TODO 这里有副作用！！！！
      // TODO batch
      // TODO initialState 没用到
      const rawValue = exist.get(parentStateNode, bind, {})
      // TODO deepMerge
      const { getDefaultState = () => ({}) } = cnode.type
      const initialStateNodeValue = { ...getDefaultState(), ...rawValue }
      const stateNode = createStateNode(initialStateNodeValue, () => onChange([cnode]))
      cnode.stateNode = stateNode
      exist.set(parentStateNode, bind, stateNode)
    },
    destroy(cnode) {
      if (!cnode.parent) {
        delete root[cnode.props.bind]
      }
    },
    api: {
      get(statePath) {
        return exist.get(root, statePath)
      },
    },
    inject(cnode) {
      return {
        state: cnode.stateNode,
      }
    },
    dump() {
      // TODO 还要保存 ordered Map 等数据结构信息
      // return root.toJS()
    },
    load() {
      // TODO 还要load ordered Map 等数据结构信息
      // TODO 如果回滚到上一次使用完全重新 render 的方式，那么就不用！
    },
  }
}
