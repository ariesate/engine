/**@jsx createElement */
import {
  createElement,
  render as renderView,
  reactive,
  computed,
  atom,
  isAtom,
  isVnodeComputed
} from 'axii'
import {
  render,
  createBuildModeFeature,
  findSchemaNode,
  SCHEMA_NODE_ID_STATE_NAME,
  SCHEMA_NODE_INDEX_STATE_NAME
} from 'yrden'
import * as axiiComponents from 'axii-components'
import Hbox from './components/Hbox'
import Vbox from './components/Vbox'
import TLayout from './components/TLayout'
import SidebarLayout from './components/SidebarLayout'
import Layout from './components/Layout'
import Editor from "./components/Editor";
import {mapValues} from "./util";

function isSlotNode(node) {
  return node.attributes.slot
}

// const schema = reactive({
//   component: 'TLayout',
//   children: {
//     header: {
//       component: 'Input'
//     },
//     content: {
//       component: 'SidebarLayout',
//       props: {
//         showSidebar: atom(false)
//       },
//       children : {
//         content: {
//           component: 'Layout'
//         }
//       }
//     }
//   }
// })

// const schema = reactive(Layout.getSchema())

const schema = reactive({
  component: 'Vbox',
  children: []
})

//
setTimeout(() => {
  console.log(1)
  schema.children.push({
    component: 'Input'
  })
}, 100)


const BuildModeFeature = createBuildModeFeature({
  listen: [{
    matcher: isSlotNode,
    listeners: {
      onClick(e, props) {
        e.stopPropagation()
        const node = findSchemaNode(schema, props[SCHEMA_NODE_ID_STATE_NAME].value)

        if (Array.isArray(node.children)) {
          node.children.push({
            component: 'Button',
            props: {
              primary: true
            },
            children: ['tetetette']
          })
        }

      },
      onKeyDown() {

      }
    }
  }],
  collect: [{
    matcher : isSlotNode,
    collector(vnode, props) {
      const node = findSchemaNode(schema, props[SCHEMA_NODE_ID_STATE_NAME].value)
      const Component = components[node.component]
      if (Component.useNamedChildrenSlot) {
        if (node.children[vnode.name] === undefined) node.children[vnode.name] = { component: null }
      } else {
        if (node.children === undefined) node.children = []
      }
    }
  }],
  inspect: (vnode, parentVnode, props) => {
    
    if(vnode?.attributes?.slot) {
      const node = findSchemaNode(schema, props[SCHEMA_NODE_ID_STATE_NAME].value)
    }

    /**
     * TODO 找到 render point:
     *  1. 纯 atom|atomComputed(!vnodeComputed) 变量的地方。
     *  2. 有名字的函数并且 非 fragment
     *
     *  用 fragmentName + parentNodeName + 他们的名字做 rp，记录到 schema 上，这些都可以改。
     */
    if(isAtom(vnode) && !isVnodeComputed(vnode)) {
      console.log(vnode, parentVnode, props)
      const node = findSchemaNode(schema, props[SCHEMA_NODE_ID_STATE_NAME].value)
      console.log(node)
      if (!node.points) node.points = {}
      node.points[parentVnode.name] = { component: null }
    }
  }
})


export const LAYOUT_PLACEHOLDER = Layout

const components = mapValues({
  ...axiiComponents,
  Hbox,
  Vbox,
  TLayout,
  SidebarLayout,
  Layout
}, Component => {
  return Component.extend ? Component.extend(BuildModeFeature) : Component
})

// setTimeout(() => {
//   console.log(1111, schema.children.content.props.showSidebar)
//   schema.children.content.props.showSidebar.value = true
// }, 100)

renderView(<Editor schema={schema} components={components}/>, document.getElementById('root'))


