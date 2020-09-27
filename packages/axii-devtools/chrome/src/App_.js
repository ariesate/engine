/** @jsx createElement */
import {createElement, vnodeComputed, createComponent} from 'axii'

// TODO 增加回调，增加 path。
function renderGroup(group, actions, path = []) {
  const {object, name, indeps = [], changed} = group
  return (
    <group inline inline-padding-left-10px inline-padding-right-10px>
      <indeps block block-display-flex flex-justify-content-center flex-align-items-flex-end>
        {indeps.map((indep, index) => {
          return <indep inline>{renderGroup(indep, actions, path.concat(index))}</indep>
        })}
      </indeps>
      <current block onClick={() => actions.onInspect(path, group)}>
        <name>{name || (typeof object)}</name>
        <changed>{changed ? '*' : ''}</changed>
      </current>
    </group>
  )
}

function App({indepTree, onInspect, onDebug}) {
  // TODO
  /**
   * 1. 树状显示
   * 2. 快速查看 indep 对象的值，至少是 console.log 出来。
   * 3. 定位到 computed/ref 的位置。ref 貌似可以通过 callee
   *
   * 4. 对象要有 name，看 axii 里面对 name 的实现。有props 等。 8268028026
   */
  return <container>{() => indepTree.value ? renderGroup(indepTree.value, { onInspect, onDebug }) : null}</container>
}

App.Style = (fragments) => {

  fragments.root.elements.group.style({
    border: '1px black solid',
  })

  fragments.root.elements.current.style({
    textAlign: 'center',
    cursor: 'pointer'
  })
}

export default createComponent(App)
