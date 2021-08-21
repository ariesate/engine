/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  propTypes,
  createElement,
  Fragment,
  atom,
  createComponent,
  atomComputed,
  reactive,
  tryToRaw,
} from 'axii';
import ExpandIcon from 'axii-icons/Plus.js'
import CollapseIcon from 'axii-icons/Minus.js'
import scen from '../pattern'

/**
 * Menu feature 规划：
 * 根据数据渲染：
 * [{
 *   title: <String>|<Vnode>,
 *   expand: false,
 *   children: []
 * }]
 *
 * TODO 用来渲染线条的 dom 应该用 use 抽出去
 */

function renderItem(item, level, actions, render, fragments, parents = []) {
  const {onFold, onOpen, onSetActive} = actions
  const hasChildren = atomComputed(() => item.children !== undefined)
  return (
    <itemContainer
      block
      block-border-width-1px
      flex-display
      flex-align-items-stretch
    >
      <item
        block
        flex-display
        flex-align-items-center
      >
        <name block flex-grow-1 onClick={() => onSetActive(item, parents)}>{() => render(item, parents)}</name>
      </item>

        {function menuChildren() {
          if (!item.children || item.children.length === 0 || item.collapsed) return null
          return (
            <itemChildrenContainer
              block
              flex-display
              flex-align-items-center
            >
              <itemSlash inline inline-width-10px inline-height-1px/>
              <itemChildren>
                {item.children.map((child, childIndex) => {
                  const nextLevel = level + 1
                  const fragmentParams = {
                    item: child,
                    level: nextLevel,
                    parents: parents.concat(item),
                    childIndex,
                    isFirst: childIndex === 0,
                    isLast: childIndex === item.children.length -1,
                  }
                  console.log("renderchildren", child.id)
                  return (
                    <itemChildContainer
                      inline
                      flex-display
                      flex-align-items-stretch
                      key={child.id}
                    >
                      {fragments.itemPrefix(fragmentParams)(
                        <itemChildPrefix
                          inline
                          flex-display
                          flex-align-items-strech
                        >
                          <itemChildPrefixLine
                            inline
                            flex-display
                            flex-direction-column
                          >
                            <itemChildPrefixLineTop inline inline-width-1px flex-grow-1/>
                            <itemChildPrefixLineBottom inline inline-width-1px flex-grow-1/>
                          </itemChildPrefixLine>
                          <itemSlashContainer
                            inline
                            flex-display
                            flex-align-items-center
                          >
                            <itemSlash inline inline-width-10px inline-height-1px/>
                          </itemSlashContainer>
                        </itemChildPrefix>
                      )}
                      <itemChildContainerList>
                        {fragments.item(fragmentParams)(renderItem(child, nextLevel, actions, render, fragments, parents.concat(item)))}
                      </itemChildContainerList>
                    </itemChildContainer>
                  )
                })}
              </itemChildren>
            </itemChildrenContainer>
          )
        }}
    </itemContainer>
  )
}

export function MindTree({data, onFold, onOpen, onSetActive, render}, fragments) {
  return (<container block>
    {function rootMenuData() {
      return data.map(item => fragments.item({item, level: 0, parents: []})(renderItem(item, 0, {
        onFold,
        onOpen,
        onSetActive
      }, render, fragments)))
    }}
  </container>)
}

MindTree.propTypes = {
  data: propTypes.object.default(() => reactive([])),
  onFold: propTypes.callback.default(() => (item) => item.collapsed = true),
  onOpen: propTypes.callback.default(() => (item) => item.collapsed = false),
  onSetActive: propTypes.callback.default(() => (item, parents, {activeItemIdPath}) => activeItemIdPath.value = parents.concat(item).map(i => i.id)),
  activeItemIdPath: propTypes.string.default(() => atom([])),
  render: propTypes.function.default(() => x => x.title)
}

MindTree.Style = (fragments) => {
  fragments.item.elements.expand.style({
    width: 20,
    userSelect: 'none',
    cursor: 'pointer'
  })

  fragments.item.elements.name.style(({item, parents, activeItemIdPath, level}) => {
    const currentPath = parents.concat(item)
    const isActive = activeItemIdPath.value.length && (currentPath.length === activeItemIdPath.value.length) && activeItemIdPath.value.every((p, i) => p === currentPath[i]?.id)
    return {
      padding: scen().spacing(),
      background: isActive ? scen().interactable().active().color(-5) : 'transparent',
      userSelect: 'none',
      cursor: 'pointer'
    }
  })

  fragments.item.elements.name.style(({level}) => {
    return {
      color: level > 0 ? scen().color(-5) : scen().color(5)
    }
  })

  fragments.item.elements.itemSlash.style(({level}) => {
    return {
      background: '#000'
    }
  })

  fragments.itemPrefix.elements.itemSlash.style(({level}) => {
    return {
      background: '#000'
    }
  })

  fragments.itemPrefix.elements.itemChildPrefixLineTop.style(({level, isFirst}) => {
    return {
      background: isFirst ? 'transparent' : '#000'
    }
  })

  fragments.itemPrefix.elements.itemChildPrefixLineBottom.style(({level, isLast}) => {
    return {
      background: isLast ? 'transparent' : '#000'
    }
  })

}


export default createComponent(MindTree)

