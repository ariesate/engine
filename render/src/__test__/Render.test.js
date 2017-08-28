/* eslint-disable react/no-multi-comp */
import React from 'react'
import PropTypes from 'prop-types'
import TestUtils from 'react-dom/test-utils'
import Render from '../Render'

function mockStateTree() {
  return {
    get() {},
    set() {},
    register() {},
  }
}

test('render primitive component', () => {
  expect(() => TestUtils.renderIntoDocument(<Render
    stateTree={mockStateTree()}
    components={{}}
    config={{}}
  />)).not.toThrow()
})

test('should provide right context', () => {
  /* eslint-disable react/prefer-stateless-function */
  class Receiver extends React.Component {
    static contextTypes = {
      stateTree: PropTypes.object,
      components: PropTypes.object,
      getScopes: PropTypes.func,
      getStatePath: PropTypes.func,
      getRenderScopes: PropTypes.func,
    }
    render() {
      return <div />
    }
  }

  const container = TestUtils.renderIntoDocument(<Render
    stateTree={mockStateTree()}
    components={{ Receiver }}
    config={{
      type: 'Receiver',
    }}
  />)

  const child = TestUtils.findRenderedComponentWithType(container, Receiver)
  expect(typeof child.context.stateTree).toBe('object')
  expect(typeof child.context.components).toBe('object')
  expect(typeof child.context.getScopes).toBe('function')
  expect(typeof child.context.getStatePath).toBe('function')
  expect(typeof child.context.getRenderScopes).toBe('function')
  expect(child.context.getRenderScopes()).toEqual([container.id])
})

