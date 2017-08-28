import React from 'react'
import ReactDom from 'react-dom'
import connect from '@cicada/render/lib/connect'
import { mapValues } from '@cicada/render/lib/util'
import Render from '@cicada/render/lib/Render'
import createStateTree from '@cicada/render/lib/createStateTree'
import createAppearance from '@cicada/render/lib/createAppearance'
import createBackground from '@cicada/render/lib/createBackground'
import applyStateTreeSubscriber from '@cicada/render/lib/applyStateTreeSubscriber'
import * as stateTreeBackground from '@cicada/render/lib/background/utility/stateTree'
import * as appearanceBackground from '@cicada/render/lib/background/utility/appearance'
import * as listenerBackground from '@cicada/render/lib/background/utility/listener'
import * as mapBackgroundToStateJob from '@cicada/render/lib/background/job/mapBackgroundToState'
import * as visibleJob from '@cicada/render/lib/background/job/visibility'
import * as interpolationJob from '@cicada/render/lib/background/job/interpolation'

import * as Steps from './Steps'

const initlaState = {
  steps: {
    steps: [{
      title: 'title 1',
      description: 'description 1',
      iconType: 'user',
    }, {
      title: 'title 2',
      description: 'description 2',
      iconType: 'solution',
    }, {
      title: 'title 3',
      description: 'description 3',
      iconType: 'credit-card',
    }],
  },
}

const stateTree = applyStateTreeSubscriber(createStateTree)(initlaState)
const appearance = createAppearance()

window.stateTree = stateTree
window.appearance = appearance

const background = createBackground({
  utilities: {
    stateTree: stateTreeBackground,
    appearance: appearanceBackground,
    listener: listenerBackground,
  },
  jobs: {
    mapBackgroundToState: mapBackgroundToStateJob,
    visible: visibleJob,
    interpolation: interpolationJob,
  },
}, stateTree, appearance)

const config = {
  children: [{
    type: 'Steps',
    bind: 'steps',
    getInitialState: () => ({
      current: 1,
    }),
    children: [{
      type: 'Steps.Title',
      children: [{
        type: 'span',
        interpolate: ({ stateTree: s, statePath }) => {
          // return 'aaa'
          return s.get(statePath).title
        },
      }],
    }, {
      type: 'Steps.Description',
      children: [{
        type: 'span',
        interpolate: ({ stateTree: s, statePath }) => {
          return s.get(statePath).description
        },
      }],
    }],
  }],
}

ReactDom.render(
  <Render
    stateTree={stateTree}
    appearance={appearance}
    components={mapValues({ Steps }, connect)}
    background={background}
    config={config}
  />, document.getElementById('root'),
)
