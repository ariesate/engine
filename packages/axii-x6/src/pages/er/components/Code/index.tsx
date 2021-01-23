import React, {useRef, useEffect} from 'react'
import CodeFlask from 'codeflask';
import FlowGraph from '@/pages/Graph'
import { Button, message } from 'antd'
import copyTextToClipboard from 'copy-text-to-clipboard'

export default function Code() {
  const codeRef = useRef()

  useEffect(() => {
    const { graph } = FlowGraph
    const flask = new CodeFlask(codeRef.current, { language: 'js' })
    flask.updateCode(JSON.stringify(graph.toJSON(), null, 4))
  })

  const copy = () => {
    const { graph } = FlowGraph
    copyTextToClipboard(JSON.stringify(graph.toJSON(), null, 4))
    message.success("成功")
  }

  return (
    <div>
      <Button onClick={copy}>复制</Button>
      <div ref={codeRef} />
    </div>
  )
}
