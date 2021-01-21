import { Graph, Node, Registry } from '@antv/x6'

export const registry = Registry.create({
  type: 'axii componnet',
})

Graph.registerAxiiComponent = registry.register
