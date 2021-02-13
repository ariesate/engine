import React, { Component } from 'react'

function NOOP() {}
const HORIZONTAL = 'horizontal'

class Split extends Component {
  static defaultProps = {
    gutterImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==',
    gutterOpenImage: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjY0IDY0IDg5NiA4OTYiIGZvY3VzYWJsZT0iZmFsc2UiIGNsYXNzPSIiIGRhdGEtaWNvbj0ibGVmdC1zcXVhcmUiIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiBmaWxsPSJjdXJyZW50Q29sb3IiIGFyaWEtaGlkZGVuPSJ0cnVlIj48cGF0aCBkPSJNMzY1LjMgNTE4LjVsMjQ2IDE3OGM1LjMgMy44IDEyLjcgMCAxMi43LTYuNXYtNDYuOWMwLTEwLjItNC45LTE5LjktMTMuMi0yNS45TDQ2NS40IDUxMmwxNDUuNC0xMDUuMmM4LjMtNiAxMy4yLTE1LjYgMTMuMi0yNS45VjMzNGMwLTYuNS03LjQtMTAuMy0xMi43LTYuNWwtMjQ2IDE3OGE4LjA1IDguMDUgMCAwIDAgMCAxM3oiLz48cGF0aCBkPSJNODgwIDExMkgxNDRjLTE3LjcgMC0zMiAxNC4zLTMyIDMydjczNmMwIDE3LjcgMTQuMyAzMiAzMiAzMmg3MzZjMTcuNyAwIDMyLTE0LjMgMzItMzJWMTQ0YzAtMTcuNy0xNC4zLTMyLTMyLTMyem0tNDAgNzI4SDE4NFYxODRoNjU2djY1NnoiLz48L3N2Zz4=',
    asideWidth: 200,
    right: true,
    gutterSize: 10,
    gutterHandleWidth: 10,
    direction: HORIZONTAL,
    hideAside: false,
    onOpen() {},
    onDrag() {},
  }

  constructor(props) {
    super(props)
    this.asideRef = React.createRef()
    this.gutterEle = React.createRef()
    this.cursor = props.direction === HORIZONTAL ? 'col-resize' : 'row-resize'
    this.dimension = props.direction === HORIZONTAL ? 'width' : 'height'
    this.position = props.direction === HORIZONTAL ? 'left' : 'top'
    this.positionEnd = props.direction === HORIZONTAL ? 'right' : 'bottom'
  }

  shouldComponentUpdate() {
    return false
  }

  componentWillReceiveProps({ hideAside }) {
    if (this.props.hideAside !== hideAside) {
      if (hideAside) {
        this.hideAside()
      } else {
        this.showAside()
      }
    }
  }

  hideAside() {
    // 不要修改当前的 offset，这样打开的时候还有
    this.asideRef.current.style.display = 'none'
    this.gutterEle.current.style.background = `url(${this.props.gutterOpenImage}) no-repeat center center #eee`
    this.gutterEle.current.style.cursor = 'pointer'
    this.gutterEle.current.removeEventListener('mousedown', this.dragging)
    this.gutterEle.current.addEventListener('click', this.props.onOpen)
  }

  showAside() {
    this.asideRef.current.style.display = 'block'
    this.gutterEle.current.style.background = `url(${this.props.gutterImage}) no-repeat center center #eee`
    this.gutterEle.current.style.cursor = 'col-resize'
    this.gutterEle.current.removeEventListener('click', this.props.onOpen)
    this.gutterEle.current.addEventListener('mousedown', this.dragging)
  }

  componentDidMount() {
    this.gutterEle.current.addEventListener('mousedown', this.dragging)
    this.attachBasicStyle()
  }

  attachBasicStyle() {
    this.mainEle.style['flex-grow'] = '1'
    this.asideRef.current.style.flex = `0 0 ${this.props.asideWidth}px`
  }

  drag = (e) => {
    if (!this.dragging) throw new Error('not dragging')
    this.offset = this.getRelativeMousePosition(e) - this.dragOffset
    this.adjustAside()
    this.props.onDrag(this.offset)
  }

  adjustAside = () => {
    // 不考虑 dimension，因为 flex 属性自己会判断
    // const dimension = this.props.direction === HORIZONTAL ? 'width' : 'height'
    // this.leftEle.current.style[dimension] = `${offset}px`
    this.asideRef.current.style.flex = `0 0 ${this.offset}px`
  }

  stopDrag = () => {
    if (!this.dragging) throw new Error('not dragging')

    window.removeEventListener('mousemove', this.drag)
    window.removeEventListener('mouseup', this.stopDrag)

    // Disable selection. Disable!
    const a = this.mainEle
    const b = this.asideRef.current
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

  getRelativeMousePosition = (e) => {
    const field = this.props.direction === HORIZONTAL ? 'clientX' : 'clientY'
    return this.props.right ? (this.end - e[field]) : (e[field] - this.start)
  }

  dragging = (e) => {
    // 右键不管
    if ('button' in e && e.button !== 0) return

    e.preventDefault()
    this.dragging = true
    window.addEventListener('mousemove', this.drag)
    window.addEventListener('mouseup', this.stopDrag)

    // Disable selection. Disable!
    const a = this.mainEle
    const b = this.asideRef.current
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
    document.body.style.cursor = this.cursor

    // Determine the position of the mouse compared to the gutter
    this.calculateBoundsAndDragOffset(e)
  }

  calculateBoundsAndDragOffset = (e) => {
    // Figure out the parent size minus padding.
    const main = this.mainEle
    const aside = this.asideRef.current

    const mainBounds = main.getBoundingClientRect()
    const asideBounds = aside.getBoundingClientRect()

    this.size = mainBounds[this.dimension]
      + asideBounds[this.dimension]
      + this.props.gutterSize

    this.start = this.props.right ? mainBounds[this.position] : asideBounds[this.position]
    this.end = this.props.right ? asideBounds[this.positionEnd] : mainBounds[this.positionEnd]

    this.dragOffset = this.getRelativeMousePosition(e) - asideBounds[this.dimension]
  }

  componentWillUnmount() {

  }

  renderGutter = () => {
    // TODO vertical
    const style = {
      background: `url(${this.props.gutterImage}) no-repeat center center #eee`,
      cursor: 'col-resize',
      width: this.props.gutterSize,
      flexShrink: 0,
      textAlign: 'center',
      position: 'relative',
      height: '100%',
    }

    return (
      <div style={style} ref={this.gutterEle} />
    )
  }

  updateMainEle = (ele) => {
    if (ele && ele !== this.mainEle) {
      // 如果之前有 width ，那么要复用之前，因为组件更新后会丢掉
      if (this.mainEle) {
        ele.style.flex = this.mainEle.style.flex
      }
      this.mainEle = ele
    }
  }

  render() {
    const style = {
      display: 'flex',
      ...this.props.style,
    }

    return (
      <div style={style} ref={this.props.forwardedRef} className={this.props.className}>
        {React.cloneElement(this.props.children[0], {
          ref: this.props.right ? this.updateMainEle : this.asideRef,
        })}
        {this.renderGutter()}
        {React.cloneElement(this.props.children[1], {
          ref: this.props.right ? this.asideRef: this.updateMainEle,
        })}
      </div>
    )
  }
}

export default React.forwardRef((props, ref) => (<Split forwardedRef={ref} {...props}>{props.children}</Split>))
