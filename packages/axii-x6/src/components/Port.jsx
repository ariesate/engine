/** @jsx createElement */
import { createElement, useContext, useViewEffect } from 'axii'
import { NodeContext} from './Node'

export default function Port({ group, id}) {
  const nodeRef = useContext(NodeContext)

  useViewEffect(() => {
    const port = nodeRef.value.addPort({
      group,
      id,
    })
    return () => {
      nodeRef.value.removePort(port)
    }
  })

  return null
}
