/** @jsx createElement */
import { createElement, useContext, useViewEffect, watch, traverse, destroyComputed } from 'axii'
import { NodeContext} from './Node'

export default function Port({ group, id, args}) {
  const nodeRef = useContext(NodeContext)

  useViewEffect(() => {
    const port = nodeRef.value.addPort({
      group,
      id,
      args
    })

    // watch args
    let unwatch
    if (args) {
      const [_, watchToken] = watch(() => traverse(args), () => {
        nodeRef.value.setPortProp(port.id, 'args', args)
      })
      unwatch = () => destroyComputed(watchToken)
    }

    return () => {
      nodeRef.value.removePort(port)
      if (unwatch) unwatch()
    }
  })

  return null
}
