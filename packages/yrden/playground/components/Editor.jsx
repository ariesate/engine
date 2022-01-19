/**@jsx createElement*/
/**@jsxFrag Fragment*/
import {
  atom,
  createElement,
  atomComputed,
  Fragment,
  createComponent,
  propTypes,
  reactive,
  replace,
  useRef,
  useViewEffect
} from "axii";
import hotkeys from "hotkeys-js";
import {render} from 'yrden'
import {
  Split,
  useLayer,
  Input,
} from 'axii-components'
import Schema from "./Schema";
import Property from "./Property";
import ComponentPicker from "./ComponentPicker";
import useFocus from "../hooks/useFocus";
import useHotkeys from "../hooks/useHotkeys";
import Vbox from "./Vbox";




function Editor({ schema, components }) {
  /**
   * hotkeys 需要有自己的作用域。于是这里要做个 focus 状态管理器了。
   */

  const layoutEditorVisible = atom(false)
  const layoutSchema = reactive({})
  const { focused, ref: schemaRef, ...focusListeners } = useFocus(true)
  const layoutEditorRef = useRef()


  const { node: layoutEditorNode} = useLayer(
    <background
      block
      block-left-0
      block-top-0
      block-height={document.body.offsetHeight}
      block-width={document.body.offsetWidth}
      block-display={atomComputed(() => layoutEditorVisible.value ? 'flex' : 'none')}
      flex-justify-content-center
      flex-align-items-center
      onClick={() => layoutEditorVisible.value = false}
    >
      <editorContainer block block-padding-10px onClick={(e) => e.stopPropagation()}>
        {/*<CompletedEditor schema={layoutSchema} components={components} ref={layoutEditorRef}/>*/}
      </editorContainer>
    </background>,
    { visible: layoutEditorVisible }
  )



  const listenOnEditableComponentDblClick = (f) => {
    f.global.elements.nodeName.onDblclick((e, {data, components}) => {
      const Component = components[data?.component]
      if (!Component?.getSchema) return

      replace(layoutSchema, Component.getSchema())
      layoutEditorVisible.value = true
      layoutEditorRef.current.focus()
    })
  }


  return (
    <container block block-width="100%" block-height="100%" {...focusListeners} tabindex={-1}>
      {() => !schema?.component ?
        <div>no schema</div> :
        <>
          <Split layout:block-height="100%" layout:block-width="100%" asideSize={atom(500)}>
            <previewPanel block block-height="100%" onKeyDown={() => console.log(1)} >
              {render(schema, components)}
            </previewPanel>
            <controlPanel block block-height="100%" onKeyDown={() => console.log(2)}>
              <Split layout:block-height="100%">
                <Schema data={schema} components={components} listeners={listenOnEditableComponentDblClick}/>
                <Property />
              </Split>
            </controlPanel>

          </Split>
          {layoutEditorNode}
        </>
      }
    </container>
  )
}

Editor.propTypes = {
  schema: propTypes.object.default(() => reactive({})),
  components: propTypes.object.default(() => reactive({}))
}

Editor.Style = (f) => {
  f.global.elements.editorContainer.style({
    background: '#fff',
    boxShadow: '0 0 8px #ccc'
  })
}

const CompletedEditor = createComponent(Editor)
export default CompletedEditor


