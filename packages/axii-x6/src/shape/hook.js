import { Graph, FunctionExt } from '@antv/x6'
import { registry } from './registry'

Graph.Hook.prototype.getAxiiComponent = function (node) {
  const getAxiiComponent = this.options.getAxiiComponent
  if (typeof getAxiiComponent === 'function') {
    const ret = FunctionExt.call(getAxiiComponent, this.graph, node)
    if (ret != null) {
      return ret
    }
  }

  let ret = node.getComponent()
  // 传入的是个 函数，直接当做 function component 执行
  if (typeof ret === 'function') {
    return FunctionExt.call(ret, this.graph, node)
  }

  // 如果是个名称(推荐做法，因为 x6 这样才能把数据序列化出来)
  if (typeof ret === 'string') {
    const component = registry.get(ret)
    if (component === null) {
      return registry.onNotFound(ret)
    }
    ret = component
  }

  return ret
}
