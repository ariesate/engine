/** @jsx createElement */
import {createElement, vnodeComputed, createComponent, watch} from 'axii'
import DrageCanvas from "./DrageCanvas";
import mockData from './data'
import 'butterfly-dag/dist/index.css';
import RelationEdge from "./RelationEdge";
import node from "./Node";


function flattenTree(indeps, nodes = [], edges = []) {
  const children = []
  indeps.forEach((indep, index) => {
    const parentPath = indep.parentPath || []
    const path = parentPath.concat(index)
    // 梳理节点
    if (!nodes.find(node => node.id === indep.id)) {
      nodes.push({
        id :indep.id,
        changed: indep.changed,
        name: indep.name,
        path,
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

      children.push(...indep.indeps.map(childIndep => ({ ...childIndep, parentPath: path})))
    }
  })

  if (children.length) flattenTree(children, nodes, edges)

  return { nodes, edges }
}

function debounce(fn, duration = 1) {
  let lastCall
  return () => {
    if (lastCall) return
    lastCall = setTimeout(() => {
      fn()
      lastCall = null
    }, duration)
  }
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
      root: ref,
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
      },
      onClick(node) {
        // CAUTION 因为起始的时候把 indepTree 伪装成 indeps 数组去处理的，所以 path[0] 没有意义。
        if (onInspect) onInspect(node.options.path.slice(1))
        canvas.focus(node)
      }
    });
  }

  // CAUTION redraw 有 bug，在一个周期内不能连续调用。只能通过一个 debounce 解决。
  const redraw = debounce(() => {
    const { nodes, edges } = flattenTree([indepTree.value])
    canvas.redraw({nodes, edges})
  })

  watch(() => indepTree.value, () => {
    if (!canvas) return
    redraw()
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
