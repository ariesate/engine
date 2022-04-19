/**@jsx createElement */
import {
  createElement,
  render as renderView,
  reactive,
  computed,
  atom,
  isAtom,
  tryToRaw,
} from 'axii'

import * as axiiComponents from 'axii-components'
import Hbox from './mocks/components/Hbox'
import Vbox from './mocks/components/Vbox'
import TLayout from './mocks/components/TLayout'
import SidebarLayout from './mocks/components/SidebarLayout'
import Layout from './components/Layout'
import Editor from "./components/Editor";
import {mapValues} from "./util";

/**
 * 当以 iframe 打开，作为组件/Layout 编辑器时，提供 window 上的接口来通信
 * 只支持同域模式
 */
window.getSchema = () => tryToRaw(schema)

const schema = reactive({
  component: 'TLayout',
  exportName: 'page',
  children: {
    header: {
      component: 'div',
    },
    content: {

      component: 'SidebarLayout',
      props: {
        showSidebar: atom(true)
      },
      children : {
        sidebar: {
          component: 'Layout'
        },
        content: {
          component: 'Vbox',
          children: [{
            component: 'Hbox',
            exportName: 'firstBox',
          }, {
            component: 'Hbox'
          }, {
            component: 'Hbox'
          }]
        }
      }
    }
  }
})

// const schema = reactive({
//   component: 'Hbox',
//   children: [{
//     component: 'Vbox',
//     children: []
//   }]
// })

// const schema = reactive({
//   component: 'Vbox',
//   children: []
// })

//
// setTimeout(() => {
//   console.log(1)
//   schema.children.push({
//     component: 'Input',
//     props : {
//       value: 3
//     }
//   })
// }, 100)

// TODO 还要拿 Editor 里面的 selectedData，放到 Editor 里面还是怎么样？



export const LAYOUT_PLACEHOLDER = Layout

const components = {
  ...axiiComponents,
  Hbox,
  Vbox,
  TLayout,
  SidebarLayout,
  Layout
}

renderView(<Editor schema={schema} components={components}/>, document.getElementById('root'))


