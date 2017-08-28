/* eslint-disable react/no-multi-comp */
import React from 'react'
import PropTypes from 'prop-types'
import { mount } from 'enzyme'
import Render from '../../Render'
import { Children } from '../../lego'
import createStateTree from '../../createStateTree'
import applyStateTreeSubscriber from '../../applyStateTreeSubscriber'
import connect from '../../connect'
import createBackground from '../../createBackground'
import * as listenerBackground from '../../background/utility/listener'
import * as stateTreeBackground from '../../background/utility/stateTree'

function noop() {}

const DemoComponent = {
  getDefaultState: () => ({
    value: 'some value',
  }),
  stateTypes: {
    value: PropTypes.string,
  },
  render({ state }) {
    return <div>{state.value}</div>
  },
}

const DemoComponentWithIdentifier = {
  getDefaultState: () => ({
    value: 'some value',
  }),
  stateTypes: {
    value: PropTypes.string,
  },
  identifiers: {
    Prefix: {},
  },
  render({ state, children }) {
    const prefix = Children.findChildren(children, DemoComponentWithIdentifier.identifiers.Prefix)
    return <div><div>{prefix}</div>{state.value}</div>
  },
}

let stateTree = {}
let background = null
beforeEach(() => {
  stateTree = applyStateTreeSubscriber(createStateTree)()
  background = createBackground({
    utilities: {
      listener: listenerBackground,
      stateTree: stateTreeBackground,
    },
  }, stateTree)
})

test('simple component render', () => {
  const container = mount(<Render
    components={{ Demo: connect(DemoComponent, 'Demo') }}
    stateTree={stateTree}
    config={{
      type: 'Demo',
      bind: 'demo',
    }}
  />)

  expect(container.html()).toEqual('<div>some value</div>')
})

test('render with identifier', () => {
  const container = mount(<Render
    components={{ Demo: connect(DemoComponentWithIdentifier, 'Demo') }}
    stateTree={stateTree}
    config={{
      type: 'Demo',
      bind: 'demo',
      children: [{
        type: 'Demo.Prefix',
        children: ['prefix'],
      }],
    }}
  />)

  expect(container.contains(<div><div>prefix</div>some value</div>)).toBe(true)
})

test('render initial state', () => {
  const container = mount(<Render
    components={{ Demo: connect(DemoComponent, 'Demo') }}
    stateTree={applyStateTreeSubscriber(createStateTree)({
      demo: {
        value: 'changed value',
      },
    })}
    config={{
      type: 'Demo',
      bind: 'demo',
    }}
  />)

  expect(container.html()).toEqual('<div>changed value</div>')
})

describe('state change in component', () => {
  // 1. merge
  describe('merge', () => {
    test('shallow merge', () => {
      const Component = {
        stateTypes: {
          clicked: PropTypes.number,
          text: PropTypes.string,
        },
        getDefaultState: () => ({
          clicked: 0,
          text: '',
        }),
        defaultListeners: {
          onClick({ state }) {
            return {
              clicked: ++state.clicked,
            }
          },
        },
        render({ listeners, state }) {
          return <button onClick={listeners.onClick}>{state.clicked}_{state.text}</button>
        },
      }

      const container = mount(<Render
        stateTree={stateTree}
        components={{ Button: connect(Component, 'Button') }}
        background={background}
        config={{
          type: 'Button',
          bind: 'button',
          listeners: {
            onClick: {
              fns: [{
                fn({ stateTree: innerStateTree }) {
                  innerStateTree.merge('button', { text: 'new_text' })
                },
              }],
            },
          },
        }}
      />)

      container.find('button').simulate('click')
      expect(container.instance().stateTree.get('button')).toEqual({ clicked: 1, text: 'new_text' })
      expect(container.text()).toBe('1_new_text')
    })

    test('deep merge', () => {
      const Component = {
        stateTypes: {
          clicked: PropTypes.number,
          extra: PropTypes.object,
        },
        getDefaultState: () => ({
          clicked: 0,
          style: {
            size: 'large',
            color: 'white',
            margin: '10px',
          },
        }),
        defaultListeners: {
          onClick({ state }) {
            return {
              clicked: ++state.clicked,
            }
          },
        },
        render({ listeners }) {
          return <button onClick={listeners.onClick} />
        },
      }

      const container = mount(<Render
        stateTree={stateTree}
        components={{ Button: connect(Component, 'Button') }}
        background={background}
        config={{
          type: 'Button',
          bind: 'button',
          listeners: {
            onClick: {
              fns: [{
                fn({ stateTree: innerStateTree }) { innerStateTree.merge('button', { style: { color: 'black' } }) },
              }],
            },
          },
        }}
      />)

      container.find('button').simulate('click')
      expect(container.instance().stateTree.get('button')).toEqual({ clicked: 1, style: { size: 'large', color: 'black', margin: '10px' } })
    })

    test('merge with array', () => {
      const Component = {
        stateTypes: {
          clicked: PropTypes.number,
          extra: PropTypes.object,
        },
        getDefaultState: () => ({
          clicked: 0,
          styles: [{
            size: 'large',
            color: 'white',
            margin: '10px',
          }, {
            size: 'small',
            color: 'white',
            margin: '1px',
          }],
        }),
        defaultListeners: {
          onClick({ state }) {
            return {
              clicked: ++state.clicked,
            }
          },
        },
        render({ listeners }) {
          return <button onClick={listeners.onClick} />
        },
      }

      const container = mount(<Render
        stateTree={stateTree}
        components={{ Button: connect(Component, 'Button') }}
        background={background}
        config={{
          type: 'Button',
          bind: 'button',
          listeners: {
            onClick: {
              fns: [{
                fn({ stateTree: innerStateTree }) { innerStateTree.merge('button', { styles: [{ color: 'black' }] }) },
              }],
            },
          },
        }}
      />)

      container.find('button').simulate('click')
      expect(container.instance().stateTree.get('button')).toEqual({ clicked: 1, styles: [{ color: 'black' }] })
    })
  })

  // 2. set
  describe('set', () => {
    test('shallow set', () => {
      const Component = {
        stateTypes: {
          clicked: PropTypes.number,
          text: PropTypes.string,
        },
        getDefaultState: () => ({
          clicked: 0,
          text: '',
        }),
        defaultListeners: {
          onClick({ state }) {
            return {
              clicked: ++state.clicked,
            }
          },
        },
        render({ listeners, state }) {
          return <button onClick={listeners.onClick}>{state.clicked}_{state.text}</button>
        },
      }

      const container = mount(<Render
        stateTree={stateTree}
        components={{ Button: connect(Component, 'Button') }}
        background={background}
        config={{
          type: 'Button',
          bind: 'button',
          listeners: {
            onClick: {
              fns: [{
                fn({ stateTree: innerStateTree }) { innerStateTree.set('button', { text: 'new_text' }) },
              }],
            },
          },
        }}
      />)

      container.find('button').simulate('click')
      expect(container.instance().stateTree.get('button')).toEqual({ clicked: 0, text: 'new_text' })
      expect(container.text()).toBe('0_new_text')
    })

    test('deep set', () => {
      const Component = {
        stateTypes: {
          clicked: PropTypes.number,
          extra: PropTypes.object,
        },
        getDefaultState: () => ({
          clicked: 0,
          style: {
            size: 'large',
            color: 'white',
            margin: '10px',
          },
        }),
        defaultListeners: {
          onClick({ state }) {
            return {
              clicked: ++state.clicked,
            }
          },
        },
        render({ listeners }) {
          return <button onClick={listeners.onClick} />
        },
      }

      const container = mount(<Render
        stateTree={stateTree}
        components={{ Button: connect(Component, 'Button') }}
        background={background}
        config={{
          type: 'Button',
          bind: 'button',
          listeners: {
            onClick: {
              fns: [{
                fn({ stateTree: innerStateTree }) { innerStateTree.set('button', { style: { color: 'black' } }) },
              }],
            },
          },
        }}
      />)

      container.find('button').simulate('click')
      expect(container.instance().stateTree.get('button')).toEqual({ clicked: 0, style: { size: 'large', color: 'black', margin: '10px' } })
    })
  })


  // didMount 中操作
  test('set data in didMount', () => {
    const Component = {
      stateTypes: {
        clicked: PropTypes.number,
        style: PropTypes.object,
      },
      getDefaultState: () => ({
        clicked: 0,
        style: {
          size: 'large',
          color: 'white',
          margin: '10px',
        },
      }),
      defaultListeners: {
        onClick({ state }) {
          return {
            ...state,
            clicked: ++state.clicked,
          }
        },
      },
      render({ listeners }) {
        return <button onClick={listeners.onClick} />
      },
    }

    const container = mount(<Render
      stateTree={stateTree}
      components={{ Button: connect(Component, 'Button') }}
      config={{
        type: 'Button',
        bind: 'button',
        didMount({ stateTree: innerStateTree }) {
          innerStateTree.merge('button', { style: { color: 'black' } })
        },
      }}
    />)
    container.find('button').simulate('click')
    expect(container.instance().stateTree.get('button')).toEqual({ clicked: 1, style: { size: 'large', color: 'black', margin: '10px' } })
  })
})
