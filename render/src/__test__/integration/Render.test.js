/* eslint-disable react/no-multi-comp */
import React from 'react'
import PropTypes from 'prop-types'
import TestUtils from 'react-dom/test-utils'
import Render from '../../Render'
import createStateTree from '../../createStateTree'
import applyStateTreeSubscriber from '../../applyStateTreeSubscriber'

describe('provided stateTree should function right', () => {
  let stateTree = {}
  beforeEach(() => {
    stateTree = applyStateTreeSubscriber(createStateTree)()
  })

  test('stateTree receive default state', () => {
    const bind = 'demo'
    const getDefaultState = () => ({ value: 'a' })

    /* eslint-disable react/prefer-stateless-function */
    class Receiver extends React.Component {
      static contextTypes = {
        stateTree: PropTypes.object,
      }
      render() {
        this.context.stateTree.register(bind, getDefaultState, 'Receiver', () => {})
        return <div />
      }
    }

    const container = TestUtils.renderIntoDocument(<Render
      stateTree={stateTree}
      components={{ Receiver }}
      config={{
        type: 'Receiver',
        bind,
      }}
    />)

    const child = TestUtils.findRenderedComponentWithType(container, Receiver)
    expect(typeof child.context.stateTree).toBe('object')
    expect(child.context.stateTree.get(bind)).toEqual({ value: 'a' })
  })

  test('merge default state with initialState', () => {
    const bind = 'demo'
    const getDefaultState = () => ({ value: 'a', extra: 'b' })

    /* eslint-disable react/prefer-stateless-function */
    class Receiver extends React.Component {
      static contextTypes = {
        stateTree: PropTypes.object,
      }
      render() {
        this.context.stateTree.register(bind, getDefaultState, 'Receiver', () => {})
        return <div />
      }
    }

    const container = TestUtils.renderIntoDocument(<Render
      components={{ Receiver }}
      config={{
        type: 'Receiver',
        bind,
      }}
      stateTree={applyStateTreeSubscriber(createStateTree)({
        demo: {
          value: 'c',
        },
      })}
    />)

    const child = TestUtils.findRenderedComponentWithType(container, Receiver)
    expect(child.context.stateTree.get(bind)).toEqual({ value: 'c', extra: 'b' })
  })
})
