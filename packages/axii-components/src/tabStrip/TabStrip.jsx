/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  createElement,
  propTypes,
  reactive,
  Fragment,
  createComponent,
  refComputed,
  ref,
  createRef,
} from 'axii'
import { uuid } from "../util";
import IconPark from '../iconPark/IconPark.jsx'
import scen from '../pattern'

/**
 * TODO
 * tab 左右移动的代码怎么写，需要判断渲染后的宽度
 */
function TabStrip({ items, activeKey, onChangeActiveKey, onClose, onAdd }, fragments) {

  const headerRef = createRef()
  const tabHeadersContainerRef = createRef()

  const headerNotOverflow = refComputed(() => {
    return !(headerRef.scrollWidth.value > tabHeadersContainerRef.clientWidth.value)
  })

  const scrollLeft = () => {
    headerRef.current.scrollLeft -= headerRef.current.clientWidth
  }

  const scrollRight = () => {
    headerRef.current.scrollLeft += headerRef.current.clientWidth
  }

  return (
    <container block>
      <tabHeadersContainer
        block
        block-border-bottom-width-1px
        ref={tabHeadersContainerRef}
        flex-display
      >
        <tabHeaderScrollLeft inline flex-grow-0 flex-display flex-align-items-center inline-display-none={headerNotOverflow} onClick={scrollLeft}>
          <IconPark type="Left" />
        </tabHeaderScrollLeft>
        <tabHeaders
          block
          block-white-space-nowrap
          block-overflow-x-hidden
          flex-grow-1
          ref={headerRef}
          flex-display
          flex-align-items-center
          block-line-height-1
        >
          {fragments.tabHeaders()(() => {
            return items.map(child =>
              fragments.tabHeader({ key: child.key})(() =>
                <tabHeader
                  inline
                  inline-padding={scen().spacing()}
                  inline-line-height-1
                  flex-display-inline
                  flex-align-items-center
                  onClick={() => onChangeActiveKey(child.key)}
                >
                  <tabHeaderValue>
                    {child.value}
                  </tabHeaderValue>
                  <IconPark type="Close" onClick={() => onClose(child.key)} layout:inline layout:inline-margin-left-10px/>
                </tabHeader>
              )
            )
          })}
          <IconPark type="PlusCross" onClick={onAdd} size={1.2}/>
        </tabHeaders>
        <tabHeaderScrollRight inline  flex-grow-0 flex-display flex-align-items-center inline-display-none={headerNotOverflow} onClick={scrollRight}>
          <IconPark type="Right" />
        </tabHeaderScrollRight>
      </tabHeadersContainer>
    </container>
  )
}

TabStrip.propTypes = {
  activeKey: propTypes.string.default(() => ref()),
  items: propTypes.array.default(() => reactive([])),
  onChangeActiveKey: propTypes.callback.default(() => (key, { activeKey }) => {
    activeKey.value = key
  }),
  onAdd: propTypes.callback.default(() => ({items}) => {
    items.push({ key: uuid(), value: 'untitled'})
  }),
  onClose: propTypes.callback.default(() => (key, { items }) => {
    const index = items.findIndex(i => i.key === key)
    items.splice(index, 1)
  }),
  closable: propTypes.callback.default(() => ref(false)),
  addable: propTypes.callback.default(() => ref(false))
}


TabStrip.Style = (fragments) => {
  const rootElements = fragments.root.elements
  rootElements.tabHeadersContainer.style({
    borderColor: scen().separateColor(),
    borderStyle: 'solid',
  })

  const pointerStyle = {
    cursor: 'pointer'
  }

  rootElements.tabHeaderScrollLeft.style(pointerStyle)
  rootElements.tabHeaderScrollRight.style(pointerStyle)

  fragments.tabHeader.elements.tabHeader.style(({ key, activeKey }) => ({
    color: key === activeKey.value ? scen().interactable().active().color() : scen().color(),
    fontWeight: key === activeKey.value ? scen().stressed().weight() : scen().weight(),
    boxShadow: key === activeKey.value ?
      `0 1px 0 0 ${scen().interactable().active().color()}` :
      undefined,
    cursor: 'pointer'
  }))
}

export default createComponent(TabStrip, [])
