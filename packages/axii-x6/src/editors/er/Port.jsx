/** @jsx createElement */
import { createElement, useContext, useViewEffect, watch, traverse, destroyComputed } from 'axii'
import ViewContext from '../../shape/context'

export default function Port({ group, id, args}) {
  const viewContext = useContext(ViewContext)

  useViewEffect(() => {

    console.log(id, args)
    const port = viewContext.node.addPort({
      group,
      id,
      args
    })

    // watch args
    if (args) {
      watch(() => traverse(args), () => {
        viewContext.node.setPortProp(port.id, 'args', args)
      })
    }

    return () => {
      viewContext.node.removePort(port)
    }
  })

  return null
}
