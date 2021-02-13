/** @jsx createElement */
import {
  createElement,
  ref,
  computed,
  useRef,
  propTypes,
} from 'axii'

function NOOP() {}

const GUTTER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg=='

// TODO 先不管 vertical ？
export default function Split({ children, gutterSize, asideSize, vertical, onChange }) {
  const mainRef = useRef()
  const asideRef = useRef()
  let isDragging = false
  let start
  let end
  let dragOffset
  let startMousePosition
  let startSize
  const dimension = vertical ? 'height' : 'width'
  const position = vertical ? 'top' : 'left'
  const positionEnd = vertical ? 'bottom' : 'right'


  const gutterStyle = computed(() => ({
    background: `url(${GUTTER_IMAGE}) no-repeat center center #eee`,
    cursor: vertical.value ? 'row-resize' : 'col-resize',
    width: vertical.value ? 'auto' : gutterSize.value,
    flexShrink: 0,
    textAlign: 'center',
    position: 'relative',
    height: vertical.value ? gutterSize.value : 'auto',
  }))


  const getRelativeMousePosition = (e) => {
    const current = vertical.value ? e['clientY'] : e['clientX']
    // TODO 应该要算关于 end 的位置
    return current - end
  }

  // 在 mouseDown 的时候算一下起始位置。
  const calculateStartBoundsAndDragOffset = (e) => {
    // Figure out the parent size minus padding.
    const main = mainRef.current
    const aside = asideRef.current

    const mainBounds = main.getBoundingClientRect()
    const asideBounds = aside.getBoundingClientRect()


    start = mainBounds[position]
    end = asideBounds[positionEnd]

    startMousePosition = getRelativeMousePosition(e)
    startSize = asideSize.value
  }



  const onDragging = (e) => {
    if (!isDragging) throw new Error('not dragging')
    const offset = getRelativeMousePosition(e) - startMousePosition
    onChange(startSize - offset)
  }

  const stopDrag = () => {
    if (!isDragging) throw new Error('not dragging')

    window.removeEventListener('mousemove', onDragging)
    window.removeEventListener('mouseup', stopDrag)

    // Disable selection. Disable!
    const a = mainRef.current
    const b = asideRef.current
    a.removeEventListener('selectstart', NOOP)
    a.removeEventListener('dragstart', NOOP)
    b.removeEventListener('selectstart', NOOP)
    b.removeEventListener('dragstart', NOOP)

    a.style.userSelect = ''
    a.style.webkitUserSelect = ''
    a.style.MozUserSelect = ''
    a.style.pointerEvents = ''

    b.style.userSelect = ''
    b.style.webkitUserSelect = ''
    b.style.MozUserSelect = ''
    b.style.pointerEvents = ''

    document.body.style.cursor = ''
  }

  const startDrag = (e) => {
    // 右键不管
    if ('button' in e && e.button !== 0) return

    e.preventDefault()
    isDragging = true
    // TODO 这里坚挺了 window，应该有更好的模式
    window.addEventListener('mousemove', onDragging)
    window.addEventListener('mouseup', stopDrag)

    // Disable selection. Disable!
    const a = mainRef.current
    const b = asideRef.current
    a.addEventListener('selectstart', NOOP)
    a.addEventListener('dragstart', NOOP)
    b.addEventListener('selectstart', NOOP)
    b.addEventListener('dragstart', NOOP)

    a.style.userSelect = 'none'
    a.style.webkitUserSelect = 'none'
    a.style.MozUserSelect = 'none'
    a.style.pointerEvents = 'none'

    b.style.userSelect = 'none'
    b.style.webkitUserSelect = 'none'
    b.style.MozUserSelect = 'none'
    b.style.pointerEvents = 'none'

    // this.gutterEle.current.parent.style.cursor = this.cursor
    document.body.style.cursor = vertical.value ? 'row-resize' : 'col-resize'

    // Determine the position of the mouse compared to the gutter
    calculateStartBoundsAndDragOffset(e)
  }

  return <container block flex-display flex-align-items-stretch>
    <main inline flex-grow-1 ref={mainRef}>{children[0]}</main>
    <gutter inline style={gutterStyle} onMouseDown={startDrag}/>
    <aside inline flex-shrink-0 flex-grow-0 flex-basis={asideSize} ref={asideRef}>{children[1]}</aside>
  </container>
}

Split.propTypes = {
  vertical: propTypes.string.default(() => ref(false)),
  gutterSize: propTypes.number.default(() => ref(10)),
  asideSize: propTypes.number.default(() => ref(250)),
  onChange: propTypes.callback.default(() => (nextAsideSize, { asideSize }) => {
    asideSize.value = nextAsideSize
  }),
}
