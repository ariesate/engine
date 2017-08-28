/* eslint-disable react/no-multi-comp */
import React from 'react'
import PropTypes from 'prop-types'
import { mount } from 'enzyme'
import Render from '../../Render'
import createStateTree from '../../createStateTree'
import applyStateTreeSubscriber from '../../applyStateTreeSubscriber'
import createAppearance from '../../createAppearance'
import createBackground from '../../createBackground'
import connect from '../../connect'
import * as stateTreeUtility from '../../background/utility/stateTree'
import * as mapBackgroundToStateJob from '../../background/job/mapBackgroundToState'

let stateTree = null
let appearance = null
beforeEach(() => {
  stateTree = applyStateTreeSubscriber(createStateTree)()
  appearance = createAppearance()
})

const DemoComponent = {
  getDefaultState: () => ({
    value: '',
  }),
  stateTypes: {
    value: PropTypes.string,
  },
  render({ state }) {
    return <div>{state.value}</div>
  },
}

test('use stateTree in mapBackgroundToState', () => {
  mount(<Render
    stateTree={stateTree}
    appearance={appearance}
    components={{ Demo: connect(DemoComponent, 'Demo') }}
    background={createBackground({
      jobs: {
        mapBackgroundToState: mapBackgroundToStateJob,
      },
      utilities: {
        stateTree: stateTreeUtility,
      },
    }, stateTree, appearance)}
    config={{
      children: [{
        bind: 'demo',
        type: 'Demo',
      }, {
        bind: 'demo2',
        type: 'Demo',
        mapBackgroundToState: [({ stateTree: s }) => {
          return {
            value: s.get('demo').value,
          }
        }],
      }],
    }}
  />)

  stateTree.set('demo.value', 'aaa')
  expect(stateTree.get('demo.value')).toBe('aaa')
  expect(stateTree.get('demo2.value')).toBe('aaa')
})
