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
  isAtom,
  isVnodeComputed,
  composeRef, debounceComputed,
} from "axii";
import {
  render,
  createBuildModeFeature,
  findSchemaNode,
  SCHEMA_NODE_ID_STATE_NAME,
  SCHEMA_NODE_INDEX_STATE_NAME
} from 'yrden'
import {
  Split,
  useLayer,
  Checkbox
} from 'axii-components'
import Schema from "./Schema";
import Property from "./Property";
import useFocus from "../hooks/useFocus";
import LayoutPreview from "./LayoutPreview";
import {nextTask} from "../util";


function isChildrenContainer(node) {
  return node.children?.[0]?.isChildren
}

/******************************
 * 用 feature 来实现的功能：
 * - 收集 childrenContainer 和相应的节点信息
 * - 点击 container 可以显示到相应的 schema 节点上
 * - 收集 render point
 *****************************/
function createComponentFeatureForEditor({ schema, selectedData, components, childrenContainerRefs }) {

  return createBuildModeFeature({
    listen: [{
      matcher: isChildrenContainer,
      listeners: {
        onClick(e, props) {
          e.stopPropagation()
          const [node] = findSchemaNode(schema, props[SCHEMA_NODE_ID_STATE_NAME].value)
          // TODO 反向选中容器节点。

        },
        onKeyDown() {

        }
      }
    }],
    collect: [{
      matcher : isChildrenContainer,
      collector(vnode, props) {
        // debugger
        const [node, path] = findSchemaNode(schema, props[SCHEMA_NODE_ID_STATE_NAME].value)
        const Component = components[node.component]
        // CAUTION 一定要放到 ref 回调里这样收集，因为这是在 feature 中，还是 initial 阶段。如果直接收集，会被跳过。
        vnode.ref = composeRef(vnode.ref, (el) => {
          if (el) {
            const last = childrenContainerRefs.find(x => (x.node === node && x.vnodeId === vnode.id))
            if (last) {
              last.ref = el
            } else {
              // 注意这里的 unshift，因为 el 是从子到父来收集的
              childrenContainerRefs.unshift({ ref: el, node, path, vnodeId: vnode.id})
            }
          }
        })
      }
    }],
    inspect: (vnode, parentVnode, props) => {
      /**
       * TODO 找到 render point:
       *  1. 纯 atom|atomComputed(!vnodeComputed) 变量的地方。
       *  2. 有名字的函数并且 非 fragment
       *
       *  用 fragmentName + parentNodeName + 他们的名字做 rp，记录到 schema 上，这些都可以改。
       */
    },
    useViewEffect(props) {
      // 处理卸载的情况
      return () => {
        const nodeId = props[SCHEMA_NODE_ID_STATE_NAME].value
        nextTask(() => {
          // 一个 node 可能有好几个 children 位置
          debounceComputed(() => {
            let start = 0
            while(childrenContainerRefs[start]) {
              if (childrenContainerRefs[start].node.id === nodeId) {
                childrenContainerRefs.splice(start, 1)
              } else {
                start++
              }
            }
          })
        })
      }
    }
  })
}

// TODO SubEditor 不如弹出一个新的 iframe ？这样自动有了个沙盒。反正最终是存到 localstorage 里面。



/******************************
 * Editor
 *****************************/
function Editor({ schema, components: rawComponents }) {

  const layoutEditorVisible = atom(false)
  const layoutSchema = reactive({})
  const { focused, ref: schemaRef, ...focusListeners } = useFocus(true)
  const layoutEditorRef = useRef()
  const selectedData = atom({})

  const childrenContainerRefs = reactive([])
  const layoutMode = atom(false)

  const components = {}
  const ComponentFeature = createComponentFeatureForEditor({
    schema,
    selectedData,
    components,
    childrenContainerRefs
  })
  Object.entries(rawComponents).forEach(([componentName, Component]) => {
    components[componentName] = Component.extend ? Component.extend(ComponentFeature) : Component
  })

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

  const { node: toolNode } = useLayer(
    <background
      block
      block-right-10px
      block-bottom-10px
      block-padding-6px
    >
      <toolContainer>
        <Checkbox value={layoutMode}>Layout 模式</Checkbox>
      </toolContainer>
    </background>,
    {
      getContainerRect: () => ({ left: undefined, top: undefined, right: 0, bottom: 0 })
    }
  )

  const listenOnEditableComponentDblClick = (f) => {
    f.global.elements.nodeName.onDblclick((e, {data, components}) => {
      const Component = components[data?.component]
      if (!Component?.getSchema) return

      // TODO 要改成打开以个 subEditor。这里就进入另一个场景了，可以变成命令式。
      /**
       * const [newComponent, exception] = await userEditComponent(Component.getSchema)
       * // 怎么替换当前的节点呢？
       * // 1. resolve conflict
       * const newPropsAndChildren = resolveConflict(newComponent, data)
       * // 2. 下面需要同时发生才行，不然 render 过程会出问题，这里要提供一个什么抽象呢？
       * debounceComputed(() => {
       *  components[data.component] = newComponent
       *   Object.assign(data, newPropsAndChildren)
       * })
       */
    })
  }


  return (
    <container block block-width="100%" block-height="100%" {...focusListeners} tabindex={-1}>
      {() => !schema?.component ?
        <div>no schema</div> :
        <>
          <Split layout:block-height="100%" layout:block-width="100%" asideSize={atom(500)}>
            <previewPanel block block-position-relative block-height="100%" onKeyDown={() => console.log(1)} >
              {render(schema, components)}
              {() => layoutMode.value ? <LayoutPreview data={childrenContainerRefs}/> : null}
            </previewPanel>
            <controlPanel block block-height="100%" onKeyDown={() => console.log(2)}>
              <Split layout:block-height="100%">
                <Schema data={schema} components={components} selectedData={selectedData} listeners={listenOnEditableComponentDblClick}/>
                {/*<Property data={selectedData} components={components}/>*/}
              </Split>
            </controlPanel>

          </Split>
          {layoutEditorNode}
          {toolNode}
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


