/** @jsx createElement */
import {createElement, useImperativeHandle, createComponent, useViewEffect, propTypes, atom, watchReactive} from 'axii'
import Editorjs from '@editorjs/editorjs'
import './Editorjs.less'
import ImageEditorPlugin from './imageEditorPlugin';
import TablePlugin from 'editorjs-table'

function EditorjsComponent({ref: parentRef, data, ...options}) {
  const editorId = `editorjs-${Date.now()}-${Math.random().toFixed(7).slice(2)}`
  let editorRef

  watchReactive(data, () => {
    if (editorRef?.render) {
      if (data.value) {
        editorRef.render(data.value)
      } else {
        editorRef.clear()
      }
    }
  })

  useViewEffect(() => {
    editorRef = new Editorjs({
      ...options,
      holder: editorId,
    })
    editorRef.isReady.then(() => {
      data.value && editorRef.render(data.value)
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

EditorjsComponent.propTypes = {
  // CAUTION TODO 为了性能我们不会实施将 data 和 editorjs 同步，这里 reactive 知识为了外部通过数据控制里面更新。
  // 需要一个标记来说明 data 不能实时同步。
  data: propTypes.object.default(() => atom({}))
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
