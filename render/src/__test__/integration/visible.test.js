/* eslint-disable react/no-multi-comp */
/* eslint-disable newline-per-chained-call */
import React from 'react'
import PropTypes from 'prop-types'
import { mount } from 'enzyme'
import Render from '../../Render'
import createStateTree from '../../createStateTree'
import applyStateTreeSubscriber from '../../applyStateTreeSubscriber'
import createAppearance from '../../createAppearance'
import connect from '../../connect'
import createBackground from '../../createBackground'
import * as stateTreeUtility from '../../background/utility/stateTree'
import * as visibilityJob from '../../background/job/visibility'

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
    return <div>{state.valu}</div>
  },
}

test('basic set appearance', () => {
  const container = mount(<Render
    stateTree={stateTree}
    appearance={appearance}
    components={{ Demo: connect(DemoComponent, 'Demo') }}
    config={{
      bind: 'demo',
      type: 'Demo',
      visible: true,
    }}
  />)

  const stateId = stateTree.get('demo')._id
  container.instance().appearance.setVisibleById(stateId, false)
  expect(container.instance().appearance.isVisibleById(stateId)).toBe(false)
  expect(container.find('div').at(0).prop('style')).toEqual({ display: 'none' })
})

test('use stateTree in visible', () => {
  const container = mount(<Render
    stateTree={stateTree}
    appearance={appearance}
    components={{ Demo: connect(DemoComponent, 'Demo') }}
    background={createBackground({
      jobs: {
        visible: visibilityJob,
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
        visible: [({ stateTree: stateTreeBg }) => {
          return stateTreeBg.get('demo').value !== 'hide'
        }],
      }],
    }}
  />)

  const stateId = stateTree.get('demo2')._id
  expect(appearance.isVisibleById(stateId)).toBe(true)
  stateTree.set('demo.value', 'hide')
  expect(appearance.isVisibleById(stateId)).toBe(false)
  expect(container.find('Demo').at(1).find('div').at(0).prop('style')).toEqual({ display: 'none' })
})

test('visible on pulse', () => {
  const container = mount(<Render
    stateTree={stateTree}
    appearance={appearance}
    components={{ Demo: connect(DemoComponent, 'Demo') }}
    background={createBackground({
      jobs: {
        visible: visibilityJob,
      },
      utilities: {
        stateTree: stateTreeUtility,
      },
    }, stateTree, appearance)}
    config={{
      children: [{
        bind: 'demo',
        type: 'Demo',
        getInitialState: () => ({
          value: 'hide',
        }),
      }, {
        bind: 'demo2',
        type: 'Demo',
        visible: [({ stateTree: st }) => {
          return st.get('demo').value !== 'hide'
        }],
      }],
    }}
  />)

  const stateId = stateTree.get('demo2')._id
  expect(appearance.isVisibleById(stateId)).toBe(false)
  expect(container.find('Demo').at(1).find('div').at(0).prop('style')).toEqual({ display: 'none' })
})
