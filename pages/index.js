import React, { PropTypes } from 'react'
import ReactDom from 'react-dom'
import connect from '@cicada/render/lib/connect'
import { mapValues } from '@cicada/render/lib/util'
import Render from '@cicada/render/lib/Render'
import createStateTree from '@cicada/render/lib/createStateTree'
import applyStateTreeSubscriber from '@cicada/render/lib/applyStateTreeSubscriber'

const DemasdoComponent = {
  defaultState: {
    value: 'some value',
  },
  stateTypes: {
    value: PropTypes.string,
  },
  render({ state }) {
    return <div>{state.value}</div>
  },
}

const config = {
  type: 'Demo',
  bind: 'demo',
}

const stateTree = applyStateTreeSubscriber(createStateTree)()

ReactDom.render(
  <Render
    config={config}
    stateTree={stateTree}
    components={mapValues({ Demo: DemoComponent }, connect)}
  />,
  document.getElementById('root'),
)
