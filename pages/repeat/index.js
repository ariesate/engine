import React from 'react'
import ReactDom from 'react-dom'
import connect from '@cicada/render/lib/connect'
import { mapValues } from '@cicada/render/lib/util'
import Render from '@cicada/render/lib/Render'
import createStateTree from '@cicada/render/lib/createStateTree'
import createAppearance from '@cicada/render/lib/createAppearance'
import applyStateTreeSubscriber from '@cicada/render/lib/applyStateTreeSubscriber'
import createBackground from '@cicada/render/lib/createBackground'
import * as listenerBackground from '@cicada/render/lib/background/utility/listener'
import * as stateTreeBackground from '@cicada/render/lib/background/utility/stateTree'
import * as interpolationJob from '@cicada/render/lib/background/job/interpolation'
import * as visibilityJob from '@cicada/render/lib/background/job/visibility'

import * as Input from './Input'
import * as Checkbox from './Checkbox'
import * as Repeat from './Repeat'
import * as Button from './Button'
import * as Box from './Box'

const stateTree = applyStateTreeSubscriber(createStateTree)()
const appearance = createAppearance()

window.stateTree = stateTree

const config = {
  type: 'Repeat',
  getInitialState: () => ({
    items: [{
      i: {
        value: 0,
      },
    }, {
      i: {
        value: 1,
      },
    }, {
      i: {
        value: 2,
      },
    }, {
      i: {
        value: 3,
      },
    }],
  }),
  children: [{
    type: 'Input',
    bind: 'i',
    visible: [({ state }) => {
      return parseInt(state.value, 10) % 2 !== 0
    }],
  }, {
    type: 'Button',
    bind: 'b',
    visible: [({ statePath }) => {
      return parseInt(statePath.get(-2), 10) % 2 !== 0
    }],
  }],
}

ReactDom.render(
  <Render
    stateTree={stateTree}
    appearance={appearance}
    components={mapValues({ Input, Checkbox, Repeat, Button, Box }, connect)}
    background={createBackground({
      utilities: {
        listener: listenerBackground,
        stateTree: stateTreeBackground,
      },
      jobs: {
        interpolation: interpolationJob,
        visibility: visibilityJob,
      },
    }, stateTree, appearance)}
    config={config}
  />,
  document.getElementById('root'),
)
