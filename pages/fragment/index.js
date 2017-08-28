import React from 'react'
import ReactDom from 'react-dom'
import connect from '@cicada/render/lib/connect'
import { mapValues } from '@cicada/render/lib/util'
import Render from '@cicada/render/lib/Render'
import createStateTree from '@cicada/render/lib/createStateTree'
import createAppearance from '@cicada/render/lib/createAppearance'
import createBackground from '@cicada/render/lib/createBackground'
import applyStateTreeSubscriber from '@cicada/render/lib/applyStateTreeSubscriber'
import convertFragment from '@cicada/render/lib/convertFragment'
import * as stateTreeBackground from '@cicada/render/lib/background/utility/stateTree'
import * as businessBackground from '@cicada/render/lib/background/utility/business'
import * as listenerBackground from '@cicada/render/lib/background/utility/listener'
import * as interpolationJob from '@cicada/render/lib/background/job/interpolation'

import * as Input from './Input'
import * as Button from './Button'

const backgroundDef = {
  utilities: {
    stateTree: stateTreeBackground,
    business: businessBackground,
    listener: listenerBackground,
  },
  jobs: {
    interpolation: interpolationJob,
  },
}

const fragments = {
  FullName: {
    linkState: {
      name: {
        from({ stateTree }) {
          return `${stateTree.get('first.value', '')}-${stateTree.get('second.value', '')}`
        },
        to({ value, stateTree }) {
          const [firstValue, secondValue] = value.split('-')
          stateTree.merge('first', { value: firstValue })
          stateTree.merge('second', { value: secondValue })
        },
        stateType: 'string',
        defaultValue: 'Jane-Doe',
      },
    },
    exposeListener: {
      onFirstNameChange: {
        source: 'children.0',
        listener: 'onChange',
      },
    },
    didMount() {
      console.log('component did mount')
    },
    getInitialState: () => ({
      first: {
        value: 'defaultFirst',
      },
      second: {
        value: 'defaultSecond',
      },
    }),
    config: {
      children: [{
        type: 'Input',
        bind: 'first',
        getInitialState: () => ({
          label: 'first name',
        }),
      }, {
        type: 'Input',
        bind: 'second',
        getInitialState: () => ({
          label: 'second name',
        }),
      }],
    },
  },
  Business: {
    linkState: {
      config: {
        from({ business }) {
          return business.get('config')
        },
        to({ value, business }) {
          business.set('config', value)
        },
        stateType: 'object',
      },
    },
    config: {
      children: [{
        type: 'Button',
        getInitialState: () => ({
          text: 'click to set business',
        }),
        listeners: {
          onClick: {
            fns: [{
              fn({ business }) {
                business.set('config', { a: 1 })
              },
            }],
          },
        },
      }],
    },
  },
}

const baseComponents = mapValues({ Input, Button }, connect)
const fragmentComponents = mapValues(fragments,
  (fragment, name) => connect(
    convertFragment(
      fragment,
      applyStateTreeSubscriber(createStateTree),
      createAppearance,
      createBackground,
      backgroundDef,
    ), name,
  ),
)

const config = {
  children: [{
    type: 'div',
    interpolation: true,
    children: ['full name: ${stateTree.get("fullName.name")}'],
  }, {
    type: 'FullName',
    bind: 'fullName',
    listeners: {
      onFirstNameChange: {
        fns: [{
          fn({ stateTree }) {
            stateTree.set('fullName.name', 'Tim-Dunken')
            console.log('now i say dunken')
          },
        }],
      },
    },
  }, {
    type: 'Button',
    getInitialState: () => ({
      text: 'reset fullName',
    }),
    listeners: {
      onClick: {
        fns: [{
          fn({ stateTree }) {
            const fullName = stateTree.get('fullName')
            fullName.name = 'Jane-Doe'
            stateTree.set('fullName', fullName)
          },
        }],
      },
    },
  // }, {
  //   type: 'Business',
  //   bind: 'business'
  }],
}

const initialState = () => ({
  fullName: {
    name: 'Jane-Doe',
  },
})

const stateTree = applyStateTreeSubscriber(createStateTree)(initialState)
const appearance = createAppearance()
window.stateTree = [stateTree]

ReactDom.render(
  <Render
    stateTree={stateTree}
    appearance={appearance}
    components={{ ...baseComponents, ...fragmentComponents }}
    background={createBackground(backgroundDef, stateTree, appearance)}
    config={config}
  />,
  document.getElementById('root'),
)

window.React = React
