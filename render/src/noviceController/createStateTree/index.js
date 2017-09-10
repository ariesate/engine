import { createUniqueIdGenerator } from '../../util'
import createStateTree from './createRawStateTree'

function joinPath(statePath) {
  return statePath.join('.')
}

export default function publicCreateStateTree(initialState, onChange) {
  const root = createStateTree(initialState)
  const generateBind = createUniqueIdGenerator('bind')
  const cnodeMap = {}

  return {
    initialize(cnode, parent) {
      const parentStatePath = parent ? parent.statePath : []
      // TODO scope 要支持指定成上一级，比如有些布局组件，自己也有 state，但并不想把子组件数据也挂在自己下面
      const { scope = [], bind = generateBind() } = cnode.props
      const currentScope = parentStatePath.concat(scope)
      const currentStatePath = currentScope.concat(bind)

      root.register(currentStatePath, cnode.type, cnode.props.getInitialState)

      // TODO 这里有副作用！！！！
      cnode.statePath = currentStatePath
      // TODO 这里有副作用！！！！
      cnodeMap[joinPath(currentStatePath)] = cnode
    },
    destroy(cnode) {
      root.unregister(cnode.statePath)
      delete cnodeMap[cnode.statePath]
    },
    api: {
      get: root.get,
      // TODO 增加 repaint 调用
      set(...argv) {
        const changes = root.set(...argv)
        changes.forEach(({ statePath }) => {
          onChange([cnodeMap[joinPath(statePath)]])
        })

        return changes
      },
      merge(...argv) {
        const changes = root.merge(...argv)
        changes.forEach(({ statePath }) => {
          onChange([cnodeMap[joinPath(statePath)]])
        })

        return changes
      },
    },
    inject(cnode) {
      return {
        state: root.get(cnode.statePath),
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
