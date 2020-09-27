/** @jsx createElement */
import {createElement, vnodeComputed, createComponent, watch} from 'axii'
import DrageCanvas from "./DrageCanvas";
import mockData from './data'
import 'butterfly-dag/dist/index.css';
import RelationEdge from "./RelationEdge";
import node from "./Node";


// TODO 增加回调，增加 path。
function flattenTree(indeps, nodes = [], edges = []) {

  const children = []
  indeps.forEach(indep => {
    // 梳理节点
    if (!nodes.find(node => node.id === indep.id)) {
      nodes.push({
        id :indep.id,
        changed: indep.changed,
        name: indep.name,
        Class: node,
        onFocus: (node) => console.log(node)
      })
    }

    // 处理边
    if (indep.indeps) {
      indep.indeps.forEach(childIndep => {
        edges.push({
          source: indep.id,
          target: childIndep.id,
          label: childIndep.keys.join(',')
        })
      })

      children.push(...indep.indeps)
    }
  })

  if (children.length) flattenTree(children, nodes, edges)

  return { nodes, edges }
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
  let canvas
  const receiveRef = (ref) => {
    console.log('receiveRef')
    canvas = new DrageCanvas({
      root: root,
      disLinkable: true, // 可删除连线
      linkable: true,    // 可连线
      draggable: true,   // 可拖动
      zoomable: true,    // 可放大
      moveable: true,    // 可平移
      layout: {
        type: 'drageLayout',
        options: {
          rankdir: 'TB',
          nodesep: 30,
          ranksep: 20,
          controlPoints: false,
        },
      },
      theme: {
        edge: {
          type: 'AdvancedBezier',
          arrow: true,
          arrowPosition: 0.5,
          Class: RelationEdge
        }
      }
    });
  }

  // TODO 目前 redraw 有 bug。只能通过一个 debounce 解决。
  let s
  watch(() => indepTree.value, () => {
    if (!canvas) return
    if (!s) {
      s = setTimeout(() => {
        const { nodes, edges } = flattenTree([indepTree.value])
        canvas.redraw({nodes, edges})
      }, 20)
    }


  })

  return <container>
    <div ref={receiveRef}></div>
  </container>
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
