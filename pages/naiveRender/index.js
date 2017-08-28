import React from 'react'
import ReactDom from 'react-dom'
import connect from '@cicada/render/lib/connect'
import { mapValues } from '@cicada/render/lib/util'
import NaiveRender from '@cicada/render/lib/NaiveRender'
import * as Input from './Input'
import * as Button from './Button'


const baseComponents = mapValues({ Button, Input }, connect)


const config = {
  children: [{
    type: 'Input',
    getInitialState: () => ({
      value: 'type what u want',
    }),
    bind: 'input',
    listeners: {
      onChange: {
        fns: [{
          fn({ state, stateTree }) {
            stateTree.set('input.value', state.value)
          },
        }],
      },
    },
  }, {
    type: 'div',
    interpolation: true,
    children: ['Hello World: ${stateTree.get("input.value")}'],
  }],
}
const components = { ...baseComponents }

ReactDom.render(
  <NaiveRender
    config={config}
    components={components}
  />,
  document.getElementById('root'),
)
