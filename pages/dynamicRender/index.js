import React from 'react'
import ReactDom from 'react-dom'
import connect from '@cicada/render/lib/connect'
import { mapValues } from '@cicada/render/lib/util'
import Render from '@cicada/render/lib/Render'
import createStateTree from '@cicada/render/lib/createStateTree'
import createAppearance from '@cicada/render/lib/createAppearance'
import createBackground from '@cicada/render/lib/createBackground'
import applyStateTreeSubscriber from '@cicada/render/lib/applyStateTreeSubscriber'
import createDynamicRender from '@cicada/render/lib/createDynamicRender'
import convertFragment from '@cicada/render/lib/convertFragment'
import * as stateTreeBackground from '@cicada/render/lib/background/utility/stateTree'
import * as listenerBackground from '@cicada/render/lib/background/utility/listener'
import * as interpolationJob from '@cicada/render/lib/background/job/interpolation'

import * as Input from './Input'
import * as Button from './Button'

const backgroundDef = {
  utilities: {
    stateTree: stateTreeBackground,
    listener: listenerBackground,
  },
  jobs: {
    interpolation: interpolationJob,
  },
}

const cicadaFragment = {
  linkState: {
    config: {
      stateType: 'object',
      from({ stateTree }) {
        return stateTree.get('dynamic.config')
      },
      to({ value }) {
        // stateTree.merge('dynamic.config', value)
        console.log(1111, value)
        return {
          'dynamic.config': value,
        }
      },
    },
  },
  config: {
    type: 'DynamicRender',
    bind: 'dynamic',
  },
}

const baseComponents = mapValues({ Button, Input }, connect)

const DynamicRender = connect(createDynamicRender(
  applyStateTreeSubscriber(createStateTree),
  createAppearance,
  createBackground,
  backgroundDef,
), 'DynamicRender')

const Cicada = connect(convertFragment(
  cicadaFragment,
  applyStateTreeSubscriber(createStateTree),
  createAppearance,
  createBackground,
  backgroundDef,
), 'Cicada')

const components = { ...baseComponents, Cicada, DynamicRender }

const config = {
  children: [{
    type: 'Button',
    getInitialState: () => ({
      text: '1 click to render a dynamic Input',
    }),
    listeners: {
      onClick: {
        fns: [{
          fn({ stateTree }) {
            stateTree.merge('dynamic.config', { type: 'Input' })
          },
        }],
      },
    },
  }, {
    type: 'Button',
    getInitialState: () => ({
      text: '2 set dynamic content',
    }),
    listeners: {
      onClick: {
        fns: [{
          fn({ stateTree }) {
            stateTree.merge('dynamic.config', {
              type: 'div',
              children: [{
                type: 'div',
                children: [{
                  type: 'Input',
                  bind: 'i1',
                }],
              }],
            })
          },
        }],
      },
    },
  }, {
    type: 'Button',
    getInitialState: () => ({
      text: '3 set dynamic input value',
    }),
    listeners: {
      onClick: {
        fns: [{
          fn({ stateTree }) {
            stateTree.merge('dynamic.value.i1.value', 'awesome')
          },
        }],
      },
    },
  }, {
    type: 'Cicada',
    bind: 'cicada',
  }, {
    type: 'DynamicRender',
    bind: 'dynamic',
  }, {
    type: 'DynamicRender',
    bind: 'dynamic2',
  }, {
    type: 'Button',
    getInitialState: () => ({
      text: 'set config and value at same time',
    }),
    listeners: {
      onClick: {
        fns: [{
          fn({ stateTree }) {
            stateTree.merge('dynamic2', {
              config: {
                type: 'Input',
                bind: 'i1',
              },
              value: {
                i1: {
                  value: 'some text',
                },
              },
            })
          },
        }],
      },
    },
  }],
}

const initialState = {}

const stateTree = applyStateTreeSubscriber(createStateTree)(initialState)
const appearance = createAppearance()
window.stateTree = [stateTree]

ReactDom.render(
  <Render
    stateTree={stateTree}
    appearance={appearance}
    components={components}
    background={createBackground(backgroundDef, stateTree, appearance)}
    config={config}
  />,
  document.getElementById('root'),
)

window.React = React
