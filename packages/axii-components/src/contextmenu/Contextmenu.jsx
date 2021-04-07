/** @jsx createElement */
/** @jsxFrag Fragment */
import { render, ref, reactive, refComputed, createElement, Fragment, useRef } from 'axii'
import layerStyle  from '../style/layer'
import scen, { colors } from "../pattern";
import {debounceComputed} from "../../../controller-axii/src/reactive";

function defaultCreateContainer() {
  const portalRoot = document.createElement('div')
  document.body.appendChild(portalRoot)
  return portalRoot
}


function defaultGetContainerStyle() {
  return {
    background: '#fff',
    backgroundClip : 'paddingBox',
    borderRadius: 2,
    boxShadow: '0 3px 6px -4px rgba(0,0,0,.12),0 6px 16px 0 rgba(0,0,0,.08),0 9px 28px 8px rgba(0,0,0,.05)'
  }
}

export function createContextmenu(
  {
    createContainer = defaultCreateContainer,
    getContainerStyle = defaultGetContainerStyle,
  } = {}) {

  const container = createContainer()
  // CAUTION 不要用 reactive，因为这里的语义不适用，而且 content 可能会有 vnode 节点。会出现问题。

  // const visible = refComputed(() => contents.length !== 0)
  const visible = ref(true)
  const menu = ref(null)
  const position = ref({})
  const containerRef = useRef()

  const containerStyle = refComputed(() => {
    console.log(position.value)
    return {
      display: 'inline-block',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 999,
      ...position.value,
      ...getContainerStyle(),
    }
  })

  const open = (v, pos = {}) => {
    debounceComputed(() => {
      menu.value = v
      visible.value = true
      position.value = pos
    })
    containerRef.current.focus()
  }

  const close = () => {
    debounceComputed(() => {
      menu.value = null
      visible.value = false
    })
  }

  const onBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      close()
    } else {
      containerRef.current.focus()
    }
  }

  function Contextmenu() {
    return <container style={containerStyle} tabIndex={-1} onBlur={onBlur} ref={containerRef}>
      {() => visible.value ? menu : null}
    </container>
  }

  render(<Contextmenu />, container)

  return {
    open,
    close
  }
}

export default createContextmenu()

