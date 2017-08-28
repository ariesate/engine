/* eslint-disable react/no-multi-comp */
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
import * as interpolationJob from '../../background/job/interpolation'

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

const DemoChildComponent = {
  render({ children }) {
    return <div>{children}</div>
  },
}

describe('use stateTree', () => {
  test('basic stateTree get', () => {
    const container = mount(<Render
      stateTree={stateTree}
      appearance={appearance}
      components={{ Demo: connect(DemoComponent, 'Demo') }}
      background={createBackground({
        jobs: {
          interpolation: interpolationJob,
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
          type: 'div',
          interpolate({ stateTree: s }) {
            return `${s.get('demo').value}bbb`
          },
        }],
      }}
    />)

    stateTree.set('demo.value', 'aaa')
    expect(stateTree.get('demo.value')).toBe('aaa')
    expect(container.html()).toEqual('<div><div><div><div>aaa</div></div><div><div>aaabbb</div></div></div></div>')
  })

  test('use statePath in children', () => {
    const container = mount(<Render
      stateTree={stateTree}
      appearance={appearance}
      components={{ Demo: connect(DemoChildComponent, 'Demo') }}
      background={createBackground({
        jobs: {
          interpolation: interpolationJob,
        },
        utilities: {
          stateTree: stateTreeUtility,
        },
      }, stateTree, appearance)}
      config={{
        children: [{
          bind: 'demo',
          type: 'Demo',
          children: [{
            type: 'div',
            interpolate({ stateTree: s, statePath }) {
              return `${s.get(statePath).value}bbb`
            },
          }],
        }],
      }}
    />)

    stateTree.set('demo.value', 'aaa')
    expect(stateTree.get('demo.value')).toBe('aaa')
    expect(container.html()).toEqual('<div><div><div><div><div><div>aaabbb</div></div></div></div></div></div>')
  })
})

