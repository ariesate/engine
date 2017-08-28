import React from 'react'
import ReactDom from 'react-dom'
import connect from '@cicada/render/lib/connect'
import { mapValues } from '@cicada/render/lib/util'
import Render from '@cicada/render/lib/Render'
import createStateTree from '@cicada/render/lib/createStateTree'
import createAppearance from '@cicada/render/lib/createAppearance'
import applyStateTreeSubscriber from '@cicada/render/lib/applyStateTreeSubscriber'
import createBackground from '@cicada/render/lib/createBackground'
import Monitor from '../../devtool/src/Monitor'
import * as Input from './Input'
import * as Checkbox from './Checkbox'
import * as Repeat from './Repeat'
import * as Button from './Button'

const stateTree = applyStateTreeSubscriber(createStateTree)({
  name: {
    label: 'name',
  },
})

const appearance = createAppearance()

window.stateTree = stateTree

const config = {
  bind: 'name',
  type: 'Input',
}

ReactDom.render(
  <Monitor
    stateTree={stateTree}
    appearance={appearance}
    background={createBackground({})}
    components={mapValues({ Input, Checkbox, Repeat, Button }, connect)}
    config={config}
  />,
  document.getElementById('root'),
)
