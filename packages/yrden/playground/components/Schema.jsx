/**@jsx createElement*/
/**@jsxFrag Fragment*/
import {
  createElement,
  Fragment,
  computed,
  reactive,
  propTypes,
  createComponent,
  atomComputed,
  atom,
  useRef
} from 'axii'
import {useLayer} from "axii-components";
import ComponentPicker from "./ComponentPicker";
import useHotkeys from "../hooks/useHotkeys";
import useFocus from "../hooks/useFocus";
import {nextTask} from "../util";


function insertToChildren(children, insertName, childrenPropType) {
  if (childrenPropType.is(propTypes.arrayOf)) {
    if (childrenPropType.argv[0].is(propTypes.element)) {
      children.push({ component: insertName })
      return true
    } else {
      // shape 结构。得找到 children 的上一个位置还能不能插入，如果不能的话，新建一个 shape 来插入
      const lastChild = children[children.length -1]
      let insertToLast
      if (lastChild) {
        insertToLast = insertToChildren(lastChild, insertName, childrenPropType.argv[0])
      }
      if (insertToLast) return true

      children.push({})
      // CAUTION 注意这里要再读一遍，因为 children 是个 reactive。拆入进去的那个引用已经变了。
      return insertToChildren(children[children.length -1], insertName, childrenPropType.argv[0])
    }
  } else {
    // TODO shape 结构，递归寻找能被插入的第一个位置
    return Object.entries(childrenPropType.argv[0]).some(([childKey, childValue]) => {

    })
  }
}


/**
 * 有下面集中情况：
 * 1. 直接是 element，包括 fragment
 * 2. 是 arrayOf
 * 3. 是 shape
 *
 * 如果是 element 就展示 "children"，只能插一个
 * 如果是 arrayOf 就展示 "children[]"，还要再继续看 item 的类型
 *   1. 如果是 shape，那么继续渲染递归 shape
 *   2. 如果是 element，那么不渲染了，还是点击上面的 children[] 来插入
 * 如果是 shape，那么展示出第一层 key，每一层继续递归：
 *   1. 如果是 element，那么不渲染了，就在 key 上
 *   2. 如果是 array，说明是固定长度的 array。那么要用 index 递归。
 *   3. 如果是 arrayOf，那么是不定长度的 array，还要递归。展示成 key[]
 *   4. 如果是 shapeOf，那么还要递归 shape。
 */
function renderChildrenShape(childrenPropType, children, components, f) {
  if (!childrenPropType) {
    // 说明是个标签节点
    return (children || []).map(child => f.child({ data: child })(<children key={child?.id}>{renderEmptyOrSchema({data: child, components}, f)}</children>))
  }

  // 如果没有名字，那么就是 children。
  if (childrenPropType.is(propTypes.element)) {
    return (
      renderEmptyOrSchema({data: children, components}, f)
    )
  }

  if (childrenPropType.is(propTypes.arrayOf)) {
    return (
      <children block>
        <childName inline>children[]</childName>
        {
          () => children ?
            children.map((child, index) =>
              f.childShape({data: child, key: index, isArray: true})(
                <childrenShape key={child?.id}>{renderChildrenShape(childrenPropType.argv[0], child, components, f)}</childrenShape>
              )
            ) :
            <emptyNode inline>+</emptyNode>
        }
      </children>
    )
  }

  if (childrenPropType.is(propTypes.shapeOf)) {
    return (
      <children block>
        {() => Object.entries(childrenPropType.argv[0]).map(([key, childPropType]) => f.childShape({ key, data: children?.[key], isArray: false })(
          <children block key={key}>
            <childName inline>{key}</childName>
            {() => renderChildrenShape(childPropType, children?.[key], components, f)}
          </children>
        ))}
      </children>
    )
  }
}


function renderEmptyOrSchema(props, f) {
  return (!props.data || props.data.component === null) ? <emptyNode inline>+</emptyNode> : renderSchema(props, f)
}

function renderSchema({data, components}, f, nodeContainerProps = {}) {
  const Component = components[data?.component]
  return (
    <nodeContainer block {...nodeContainerProps} tabIndex={-1}>
      <nodeName inline>{
        () => {
          // 文字、数字等可以渲染的节点
          return typeof data !== 'object' ? JSON.stringify(data): data.component
        }}
      </nodeName>
      {() => {
        if (!data?.children) return null
        // CAUTION 这里没有严格检测是普通标签还是组件，只是没匹配就认为是普通标签
        return (
          <childrenContainer block block-padding-left-20px>
            {
              () => Component ?
                renderChildrenShape(Component.propTypes.children, data.children, components, f) :
                data.children?.map(child => f.child({ data: child })(<children key={child?.id}>{renderEmptyOrSchema({data: child, components}, f)}</children>))
            }
          </childrenContainer>
        )
      }}
      {
        () => {
          if (!Component || !data.points) return null
          return (
            <pointsContainer block flex-display block-padding-left-20px>
              <points block>
                {
                  Object.entries(data.points).map(([pointName, child]) => (
                    <point block key={pointName}>
                      <pointName inline>#{pointName}</pointName>
                      {f.child({data: child})(renderEmptyOrSchema({data: child, components}, f))}
                    </point>
                  ))
                }
              </points>
            </pointsContainer>
          )
        }
      }
    </nodeContainer>
  )
}

function Schema({ data, components, selectedData }, f) {

  // 这里需要注册 hotkeys
  let pickerLayer

  const { focused: schemaTreeFocused, ref: schemaTreeFocusRef, ...schemaTreeFocusProps } = useFocus(true)
  const componentPickerVisible = atom(false)
  const inputRef = useRef()

  useHotkeys('i', () => {
    if (schemaTreeFocused.value) {
      // TODO 判断是否可以插入 children
      //  1. 选中组件，判断 children
      //  2. 选中 children
      //  3. 选中 rp

      if (selectedData.value.component) {
        const Component = components[selectedData.value.component]
        // 1. 普通结点和组件结点可以插入
        if(Component?.propTypes?.children || !Component) {
          componentPickerVisible.value = true
          nextTask(() => {
            inputRef.current.focus()
          })
        }
      }

      // 2. TODO 选中 children 也可以打开
      // 3. TODO 选中 rp 也可以打开
    }
  })

  // TODO 删除位置
  useHotkeys('backspace', () => {
    if (schemaTreeFocused.value) {
    }
  })

  // TODO 如果是按 enter，可以在后面插入一个
  useHotkeys('enter', () => {
    if (schemaTreeFocused.value) {
    }
  })


  // 对可插入的位置开始执行插入操作
  const onSelectComponent = (insertComponentName) => {
    /**
     *  1. 如果是标签结点，直接插在下面就行了。
     *  2. 如果是组件被插入，默认达到第一个能插 children 的位置
     *  3. 如果是组件的 children 位插入，直接插就行了。如果是 被删除，需要上级的信息，进行快捷操作。
     */
    if (selectedData.value.component) {
      const Component = components[selectedData.value.component]
      if (!Component) {
        if (!selectedData.value.children) selectedData.value.children = []
        selectedData.value.children.push({ component : insertComponentName})
      } else if(Component.propTypes.children){
        // TODO 读取第一个可插入位置
        let base = selectedData.value.children
        if (!base) {
          if (Component.propTypes.children.is(propTypes.arrayOf)) {
            base = []
          } else {
            base = {}
          }
          selectedData.value.children = base
        }
        // 随 propTypes.children 结构来构建
        insertToChildren(selectedData.value.children, insertComponentName, Component.propTypes.children)

      }
    }

    componentPickerVisible.value = false
    schemaTreeFocusRef.current.focus()
  }

  //TODO 如果组件重新渲染，会导致重新执行这个 onClick。
  // 但全是是要重新执行，因为引用都变了，只不过之前的那个要卸载掉。
  // 这个行为就是对递归方便，但其实是不应该的？因为可能会造成难以预计的问题？
  f.global.elements.nodeName.onClick((e, { data }, { data: dataStack }) => {
    console.log(data, dataStack)
    selectedData.value = data
  })

  const attachInputRef = f => {
    f.root.elements.input.ref(inputRef)
    f.root.elements.input.onKeyDown(e => {
      if(e.code === 'Escape') componentPickerVisible.value = false
    })
  }



  pickerLayer = useLayer(
    <background
      block
      block-left-0
      block-top-0
      block-height={document.body.offsetHeight}
      block-width={document.body.offsetWidth}
      block-display={atomComputed(() => componentPickerVisible.value ? 'flex' : 'none')}
      flex-justify-content-center
      flex-align-items-center
      onClick={() => componentPickerVisible.value = false}
    >
      <editorContainer block block-padding-10px onClick={(e) => e.stopPropagation()}>
        {() => componentPickerVisible.value ?
          <ComponentPicker
            onSelect={onSelectComponent}
            components={components}
            listeners={attachInputRef}
          /> :
          null
        }
      </editorContainer>
    </background>,
    { visible: componentPickerVisible }
  )

  return (
    <container block>
      {renderSchema({data, components}, f, { ref: schemaTreeFocusRef, ...schemaTreeFocusProps })}
      {pickerLayer?.node || null}
    </container>
  )
}

Schema.propTypes = {
  data: propTypes.object.default(() => reactive({})),
  components: propTypes.object.default(() => reactive({})),
  selectedData: propTypes.object.default(() => atom())
}

Schema.Style = (f) => {

  f.root.elements.container.style({
    userSelect: 'none'
  })

  f.global.elements.nodeName.style(({ selectedData, data }) => ({
    padding:4,
    background: ((data.id && selectedData.value?.id === data.id) || selectedData.value === data) ? '#71a6e7': '#ccc',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis'
  }))


  f.global.elements.emptyNode.style({
    padding : '0 4px',
    color: '#ccc',
    cursor: 'pointer'
  })

  const nameLikeStyle = {
    fontSize: 11,
    color: '#fff',
    padding:'0 4px',
    background: '#6bddf6',
    radius:2
  }

  f.global.elements.childName.style(nameLikeStyle)
  f.global.elements.pointName.style(nameLikeStyle)


  f.global.elements.editorContainer.style({
    background: '#fff',
    boxShadow: '0 0 8px #ccc'
  })
}


const StyledSchema = createComponent(Schema)

export default StyledSchema
