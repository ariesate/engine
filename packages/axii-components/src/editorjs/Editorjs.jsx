/** @jsx createElement */
import { createElement, useImperativeHandle, createComponent, useViewEffect } from 'axii'
import Editorjs from '@editorjs/editorjs'
import './Editorjs.less'
import ImageEditorPlugin from './imageEditorPlugin';
import TablePlugin from 'editorjs-table'

function EditorjsComponent({ref: parentRef, data, ...options}) {
  const editorId = `editorjs-${Date.now()}-${Math.random().toFixed(7).slice(2)}`
  let editorRef
  useViewEffect(() => {
    editorRef = new Editorjs({
      ...options,
      holder: editorId,
      data
    })
    return () => editorRef.destroy()
  })

  if (parentRef) {
    useImperativeHandle(parentRef, () => new Proxy({}, {
      get(target, method) {
        return editorRef[method]
      }
    }))
  }

  return <editorContainer block >
    <editorRoot id={editorId} />
  </editorContainer>
}

EditorjsComponent.Style = (fragments) => {
  fragments.root.elements.editorContainer.style({
    background: '#fff'
  })
}


EditorjsComponent.forwardRef = true

const StyledEditorjsComponent = createComponent(EditorjsComponent)
StyledEditorjsComponent.ImageEditorPlugin = ImageEditorPlugin
StyledEditorjsComponent.TablePlugin = TablePlugin

export default StyledEditorjsComponent
