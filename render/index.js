import React, { PropTypes } from 'react'
import ReactDom from 'react-dom'

import createConnect from './src/createConnect'
import { mapValues } from './src/util'
import Provider from './src/Provider'

const DemoComponent = {
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

const connect = createConnect()
const config = {
  type: 'Demo',
  bind: 'demo',
}

const initialState = {
  demo: {
    value: 'Jim',
  },
}

ReactDom.render(
  <Provider
    config={config}
    components={mapValues({ Demo: DemoComponent }, connect)}
    value={initialState}
  />, document.getElementById('root'),
)
