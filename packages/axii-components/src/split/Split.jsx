/** @jsx createElement */
import {
  createElement,
  atom,
  computed,
  useRef,
  propTypes,
} from 'axii'

function NOOP() {}

const GUTTER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg=='

// TODO 先不管 vertical ？
export default function Split({ children, gutterSize, asideSize, vertical, onChange, asideLeft }) {
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
    cursor: vertical.value ? 'row-resize' : 'col-resize',
    width: vertical.value ? 'auto' : gutterSize.value,
    height: vertical.value ? gutterSize.value : 'auto',
    position: 'relative',
    flexShrink: 0,
    textAlign: 'center',
    display: 'flex',
    flexDirection: vertical.value ? 'column' : 'row',
    justifyContent: 'center',
    alignItems: 'stretch',
  }))

  const gutterLineStyle = computed(() => ({
    background: `#eee`,
    cursor: vertical.value ? 'row-resize' : 'col-resize',
    width: vertical.value ? 'auto' : 1,
    flexShrink: 0,
    textAlign: 'center',
    position: 'relative',
    height: vertical.value ? 1 : 'auto',
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
    // CAUTION  offset 永远都是往后边拉为正，往左边拉为负。所以如果是左边为 aside 的话，就要加上 offset.
    onChange(asideLeft.value ? startSize + offset : startSize - offset)
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

  const leftFlexGrow = computed(() => {
    return asideLeft.value ? 0 : 1
  })
  const rightFlexGrow = computed(() => {
    return asideLeft.value ? 1 : 0
  })
  const leftFlexShrink = computed(() => {
    return asideLeft.value ? 0 : 'auto'
  })
  const rightFlexShrink = computed(() => {
    return asideLeft.value ? 'auto' : 0
  })

  const leftFlexBasis = computed(() => {
    return asideLeft.value ? asideSize.value : 'auto'
  })
  const rightFlexBasis = computed(() => {
    return asideLeft.value ? 'auto' : asideSize.value
  })


  return <container block flex-display flex-align-items-stretch>
    <main inline flex-grow={leftFlexGrow} flex-shrink={leftFlexShrink} flex-basis={leftFlexBasis} ref={mainRef} inline-overflow-x-auto>{children[0]}</main>
    <gutter inline style={gutterStyle} onMouseDown={startDrag}>
      <gutterLine style={gutterLineStyle}/>
    </gutter>
    <aside inline flex-grow={rightFlexGrow} flex-shrink={rightFlexShrink} flex-basis={rightFlexBasis} ref={asideRef} inline-overflow-x-auto>{children[1]}</aside>
  </container>
}

Split.propTypes = {
  vertical: propTypes.string.default(() => atom(false)),
  gutterSize: propTypes.number.default(() => atom(10)),
  asideLeft: propTypes.number.default(() => false),
  asideSize: propTypes.number.default(() => atom(350)),
  onChange: propTypes.callback.default(() => (nextAsideSize, { asideSize }) => {
    asideSize.value = nextAsideSize
  }),
  children: propTypes.shapeOf([
    propTypes.element(),
    propTypes.element(),
  ])
}
