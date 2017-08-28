// import createConnect from 'cicada-render/createConnect.js'
import PropTypes from 'prop-types'
import connect from '@cicada/render/lib/connect'
import { mapValues } from '@cicada/render/lib/util'
import Render from '@cicada/render/lib/Render'
import createStateTree from '@cicada/render/lib/createStateTree'
import applyStateTreeSubscriber from '@cicada/render/lib/applyStateTreeSubscriber'

const DemoComponent = {
  defaultState: {
    value: 'some value',
  },
  stateTypes: {
    value: PropTypes.string,
  },
  render({ state }) {
    return (<div>{state.value}</div>)
  },
}

const config = {
  type: 'Demo',
  bind: 'demo',
}

stateTree = applyStateTreeSubscriber(createStateTree)()

export default () => (
  <Render
    config={config}
    stateTree={stateTree}
    components={mapValues({ Demo: DemoComponent }, connect)}
  />
)
