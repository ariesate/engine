/**@jsx createElement */
import {
  createElement,
  render,
  reactive,
  computed,
  atom,
  isAtom,
  tryToRaw,
  useRef,
  useViewEffect
} from 'axii'
import { schemaToComponent } from 'yrden'
import * as axiiComponents from "axii-components";
import Hbox from "./mocks/components/Hbox";
import Vbox from "./mocks/components/Vbox";
import TLayout from "./mocks/components/TLayout";
import SidebarLayout from "./mocks/components/SidebarLayout";
import Layout from "./components/Layout";

const components = {
  ...axiiComponents,
  Hbox,
  Vbox,
  TLayout,
  SidebarLayout,
  Layout
}

const Input = components.Input


function App() {
  const subRef = useRef()
  const ready = atom(false)
  let Component

  useViewEffect(() => {
    setTimeout(() => {
      const schema = subRef.current.contentWindow.getSchema()

      Component = schemaToComponent(schema, components)
      console.log(Component.propTypes)
      ready.value = true
    }, 1000)

  })

  return <div>
    <div style={{display: 'none'}}><iframe src='./index.html' ref={subRef}/></div>
    {() => ready.value ?
      <Component page_showHeader={false}>
        {
          {
            page : {
              header: {
                component: 'Input'
              },
            },
            page_firstBox : [{
              component: 'Button',
              children: ['test']
            }]
          }
        }
      </Component> :
      null
    }
  </div>
}

render(<App />, document.getElementById('root'))
