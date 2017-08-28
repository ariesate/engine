import React from 'react'
import PropTypes from 'prop-types'
import TestUtils from 'react-dom/test-utils'
import connect from '../connect'
import createStateTree from '../createStateTree'
import applyStateTreeSubscriber from '../applyStateTreeSubscriber'

function noop() {}

function joinPath(arr) {
  return arr.filter(a => a !== undefined).join('.')
}

function createBackground() {
  return {
    cancel: noop,
    register() {
      return {
        cancel: noop,
        inject: componentArgs => componentArgs,
      }
    },
  }
}

function applySaveRegisterArgs(inputCreateStateTree) {
  return () => {
    const stateTree = inputCreateStateTree()
    let registerArgs
    return {
      ...stateTree,
      register(...args) {
        registerArgs = args
        return stateTree.register(...args)
      },
      getRegisterArgs() {
        return registerArgs
      },
    }
  }
}

class Render extends React.Component {
  static childContextTypes = {
    stateTree: PropTypes.object,
    appearance: PropTypes.object,
    getScopes: PropTypes.func,
    getStatePath: PropTypes.func,
    background: PropTypes.object,
  }
  constructor() {
    super()
    this.stateTree = applySaveRegisterArgs(applyStateTreeSubscriber(createStateTree))()
    this.appearance = {
      register() {
        return {
          cancel() {},
          hijack: render => render,
        }
      },
    }
  }
  getChildContext() {
    return {
      stateTree: this.stateTree,
      appearance: this.appearance,
      getScopes: noop,
      getStatePath: noop,
      background: createBackground(),
    }
  }
  render() {
    return (<div>
      {this.props.children}
    </div>)
  }
}

let DemoComponent = {}
beforeEach(() => {
  DemoComponent = {
    stateTypes: {
      name: PropTypes.string,
      age: PropTypes.number,
    },
    getDefaultState: () => ({
      name: 'Jim',
      age: 21,
    }),
  }
})

test('should connect to Render', () => {
  expect(() => TestUtils.renderIntoDocument(<Render
    components={{ Demo: connect(DemoComponent, 'Demo') }}
    config={{
      type: 'Demo',
      bind: 'demo',
    }}
  />)).not.toThrow()
})

describe('should call context when render', () => {
  test('should register initial state when render', () => {
    const type = 'Demo'
    const Connected = connect(DemoComponent, type)
    const bind = 'user'
    const container = TestUtils.renderIntoDocument(
      <Render>
        <Connected bind={bind} />
      </Render>,
    )

    const child = TestUtils.findRenderedComponentWithType(container, Render)
    expect(typeof child.stateTree).toBe('object')
    const registerArgs = child.stateTree.getRegisterArgs()
    expect(registerArgs[0]).toEqual(bind)
    expect(registerArgs[1]()).toEqual(DemoComponent.getDefaultState())
    expect(registerArgs[2]).toEqual(type)
    expect(typeof registerArgs[3]).toEqual('object')

    const autoBindContainer = TestUtils.renderIntoDocument(
      <Render>
        <Connected />
      </Render>,
    )

    const autoBindChild = TestUtils.findRenderedComponentWithType(autoBindContainer, Render)
    expect(autoBindChild.stateTree.getRegisterArgs()[0]).toEqual(`${type}(_1)`)
  })

  test('should register to right scope', () => {
    /* eslint-disable react/no-multi-comp */
    class Scope extends React.Component {
      static propTypes = {
        relativeChildStatePath: PropTypes.string,
      }
      static contextTypes = {
        getScopes: PropTypes.func,
        getStatePath: PropTypes.func,
      }

      static childContextTypes = {
        getScopes: PropTypes.func,
        getStatePath: PropTypes.func,
      }

      getChildContext() {
        return {
          getScopes: () => {
            const scopes = this.context.getScopes() || []
            const childStatePath = joinPath([this.context.getStatePath(), this.props.relativeChildStatePath])
            return scopes.concat({ statePath: childStatePath })
          },
          getStatePath: () => {
            return joinPath([this.context.getStatePath(), this.props.relativeChildStatePath])
          },
        }
      }
      render() {
        return <div>{this.props.children}</div>
      }
    }

    const type = 'Demo'
    const Connected = connect(DemoComponent, type)
    const bind = 'user'
    const scopePath = 'test'
    const container = TestUtils.renderIntoDocument(
      <Render>
        <Scope relativeChildStatePath={scopePath}>
          <Connected bind={bind} />
        </Scope>
      </Render>,
    )

    const child = TestUtils.findRenderedComponentWithType(container, Render)
    expect(typeof child.stateTree).toBe('object')
    const registerArgs = child.stateTree.getRegisterArgs()
    expect(registerArgs[0]).toEqual(`${scopePath}.${bind}`)
  })
})

describe('should receive right injected arguments', () => {
  test('in default listeners', () => {
    let receivedArgs = []
    let listenerCalled = false
    const Component = {
      defaultListeners: {
        onClick(...args) {
          listenerCalled = true
          receivedArgs = args
          return {}
        },
      },
      render({ listeners }) {
        return <button onClick={listeners.onClick} />
      },
    }

    const Connected = connect(Component)
    const container = TestUtils.renderIntoDocument(
      <Render>
        <Connected />
      </Render>,
    )
    const button = TestUtils.findRenderedDOMComponentWithTag(container, 'button')
    TestUtils.Simulate.click(button)
    expect(listenerCalled).toBe(true)
    expect(receivedArgs[0].state).toBeDefined()
    expect(receivedArgs[0].listeners).toBeDefined()
    expect(receivedArgs[0].context).toBeDefined()
    expect(receivedArgs[0].instance).toBeDefined()
  })

  test('in interceptor', () => {
    let receivedArgs = []
    let interceptorCalled = false
    const Component = {
      defaultIntercepters: { beforeChange: () => {} },
      render({ listeners, intercepters }) {
        intercepters.beforeChange()
        return <button onClick={listeners.onClick} />
      },
    }

    function intercepter(...args) {
      receivedArgs = args
      interceptorCalled = true
    }
    const Connected = connect(Component)
    const container = TestUtils.renderIntoDocument(
      <Render>
        <Connected intercepters={{ beforeChange: intercepter }} />
      </Render>,
    )
    const button = TestUtils.findRenderedDOMComponentWithTag(container, 'button')
    TestUtils.Simulate.click(button)
    expect(interceptorCalled).toBe(true)
    expect(receivedArgs[0].state).toBeDefined()
    expect(receivedArgs[0].stateTree).toBeDefined()
    expect(receivedArgs[0].statePath).toBeDefined()
    expect(receivedArgs[0].rootStatePath).toBeDefined()
  })

  test('in didMount', () => {
    let componentDidMountArgs = []
    let componentDidMountCalled = false
    let didMountArgs = []
    let didMountCalled = false
    const Component = {
      componentDidMount: (...args) => {
        componentDidMountArgs = args
        componentDidMountCalled = true
      },
      render({ listeners, state }) {
        return <button onClick={listeners.onClick}>{state.clicked}</button>
      },
    }

    function didMount(...args) {
      didMountArgs = args
      didMountCalled = true
    }

    const Connected = connect(Component)
    TestUtils.renderIntoDocument(
      <Render>
        <Connected didMount={didMount} />
      </Render>,
    )
    expect(didMountCalled).toBe(true)
    expect(didMountArgs[0].state).toBeDefined()
    expect(didMountArgs[0].stateTree).toBeDefined()
    expect(didMountArgs[0].statePath).toBeDefined()
    expect(didMountArgs[0].rootStatePath).toBeDefined()

    expect(componentDidMountCalled).toBe(true)
    expect(componentDidMountArgs[0].state).toBeDefined()
    expect(componentDidMountArgs[0].listeners).toBeDefined()
    expect(componentDidMountArgs[0].context).toBeDefined()
    expect(componentDidMountArgs[0].instance).toBeDefined()
  })
})
