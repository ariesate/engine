/* eslint-disable react/no-multi-comp */
import React from 'react'
import PropTypes from 'prop-types'
import { mount } from 'enzyme'
import Render from '../../Render'
import connect from '../../connect'
import createStateTree from '../../createStateTree'
import createAppearance from '../../createAppearance'
import createBackground from '../../createBackground'
import * as stateTreeUtility from '../../background/utility/stateTree'
import applyStateTreeSubscriber from '../../applyStateTreeSubscriber'
import { mapValues } from '../../util'
import convertFragment from '../../convertFragment'

const ButtonComponent = {
  stateTypes: {
    clicked: PropTypes.number,
  },
  getDefaultState: () => ({
    clicked: 0,
  }),
  defaultListeners: {
    onClick({ state }) {
      return {
        clicked: ++state.clicked,
      }
    },
  },
  render({ listeners, state }) {
    return <button onClick={listeners.onClick}>{state.clicked}</button>
  },
}

const InputComponent = {
  stateTypes: {
    value: PropTypes.string,
  },
  getDefaultState: () => ({
    value: '',
  }),
  defaultListeners: {
    onChange({ state }, e) {
      return {
        value: e.target.value,
      }
    },
  },
  render({ listeners, state }) {
    return <input onChange={listeners.onChange} value={state.value} />
  },
}

const fragments = {
  FullName: {
    linkState: {
      name: {
        from({ stateTree }) {
          return `${stateTree.get('first.value', '')}-${stateTree.get('second.value', '')}`
        },
        to({ value, stateTree }) {
          const [firstValue, secondValue] = value.split('-')
          stateTree.merge('first', { value: firstValue })
          stateTree.merge('second', { value: secondValue })
        },
        stateType: 'string',
      },
    },
    exposeListener: {
      onFirstNameChange: {
        source: '0',
        listener: 'onChange',
      },
    },
    getInitialState: () => ({
      first: {
        value: 'defaultFirst',
      },
      second: {
        value: 'defaultSecond',
      },
    }),
    config: {
      children: [{
        type: 'Input',
        bind: 'first',
        props: {
          label: 'first name',
        },
      }, {
        type: 'Input',
        bind: 'second',
        props: {
          label: 'second name',
        },
      }],
    },
  },
}

test('render a simple fragment', () => {
  const fragment = {
    config: {
      type: 'Button',
      bind: 'button',
    },
  }

  const Button = connect(ButtonComponent, 'Button')
  const appliedCreateStateTree = applyStateTreeSubscriber(createStateTree)
  const FragmentButton = connect(
    convertFragment(
      fragment,
      appliedCreateStateTree,
      createAppearance,
      createBackground,
      { utilities: { stateTree: stateTreeUtility } },
    ), 'FragmentButton')

  const config = {
    type: 'FragmentButton',
    bind: 'frag',
  }

  const stateTree = appliedCreateStateTree()

  const container = mount(<Render
    config={config}
    components={{ Button, FragmentButton }}
    stateTree={stateTree}
  />)

  container.find('button').simulate('click')
  // expect(container.instance().stateTree.get('frag')[INNER_STATE_TREE_KEY]).toEqual({ button: { clicked: 1 } })
  expect(container.html()).toBe('<div><button>1</button></div>')
})

test('test link state', () => {
  const config = {
    children: [{
      type: 'FullName',
      bind: 'fullName',
      listeners: {
        onFirstNameChange: {
          fns: [{
            fn() {
            // fn(...argv) {
              // console.log('on first name change', ...argv)
            },
          }],
        },
      },
    }, {
      type: 'Button',
      getInitialState: () => ({
        text: 'reset fullName',
      }),
      listeners: {
        onClick: {
          fns: [{
            fn({ stateTree }) {
              const fullName = stateTree.get('fullName')
              fullName.name = 'Jane-Doe'
              stateTree.set('fullName', fullName)
            },
          }],
        },
      },
    }],
  }

  const initialState = {
    fullName: {
      name: 'Jane-Doe',
    },
  }

  const baseComponents = mapValues({ Input: InputComponent, Button: ButtonComponent }, connect)
  const fragmentComponents = mapValues(fragments,
    (fragment, name) => connect(
      convertFragment(
        fragment,
        applyStateTreeSubscriber(createStateTree),
        createAppearance,
        createBackground,
        { utilities: { stateTree: stateTreeUtility } },
      ), name,
    ),
  )

  const container = mount(<Render
    stateTree={applyStateTreeSubscriber(createStateTree)(initialState)}
    appearance={createAppearance()}
    components={{ ...baseComponents, ...fragmentComponents }}
    config={config}
  />)

  const inputInstance = container.find('input').first()
  const secondInputInstance = container.find('input').at(1)
  expect(container.root.instance().stateTree.get('fullName')).toEqual({ name: 'Jane-Doe' })
  expect(inputInstance.prop('value')).toEqual('Jane')
  expect(secondInputInstance.prop('value')).toEqual('Doe')

  inputInstance.simulate('change', { target: { value: 'Tim' } })
  expect(container.root.instance().stateTree.get('fullName')).toEqual({ name: 'Tim-Doe' })

  secondInputInstance.simulate('change', { target: { value: 'Dunken' } })
  expect(container.root.instance().stateTree.get('fullName')).toEqual({ name: 'Tim-Dunken' })
})

test('performance', () => {
  let fromCalled = 0
  let toCalled = 0
  const perfFragments = {
    FullName: {
      linkState: {
        name: {
          from({ stateTree }) {
            fromCalled += 1
            return `${stateTree.get('first.value', '')}-${stateTree.get('second.value', '')}`
          },
          to({ stateTree, value }) {
            toCalled += 1
            const [firstValue, secondValue] = value.split('-')
            stateTree.merge('first', { value: firstValue })
            stateTree.merge('second', { value: secondValue })
          },
          stateType: 'string',
        },
      },
      config: {
        children: [{
          type: 'Input',
          bind: 'first',
          props: {
            label: 'first name',
          },
        }, {
          type: 'Input',
          bind: 'second',
          props: {
            label: 'second name',
          },
        }],
      },
    },
  }

  const config = {
    children: [{
      type: 'FullName',
      bind: 'fullName',
      listeners: {
        onFirstNameChange: {
          fns: [{
            fn(...argv) {
              /* eslint-disable no-console */
              console.log('on first name change', ...argv)
              /* eslint-enable no-console */
            },
          }],
        },
      },
    }],
  }

  const initialState = {
    fullName: {
      name: 'Jane-Doe',
    },
  }

  const baseComponents = mapValues({ Input: InputComponent, Button: ButtonComponent }, connect)
  const fragmentComponents = mapValues(perfFragments,
    (fragment, name) => connect(
      convertFragment(
        fragment,
        applyStateTreeSubscriber(createStateTree),
        createAppearance,
        createBackground,
        { utilities: { stateTree: stateTreeUtility } },
      ), name,
    ),
  )

  const stateTree = applyStateTreeSubscriber(createStateTree)(initialState)
  const container = mount(<Render
    stateTree={stateTree}
    appearance={createAppearance()}
    components={{ ...baseComponents, ...fragmentComponents }}
    config={config}
  />)

  const inputInstance = container.find('input').first()
  const secondInputInstance = container.find('input').at(1)
  expect(container.root.instance().stateTree.get('fullName')).toEqual({ name: 'Jane-Doe' })
  expect(inputInstance.prop('value')).toBe('Jane')
  expect(secondInputInstance.prop('value')).toBe('Doe')

  // 注意，新引擎中不会在初始化时计算 defaultState
  expect(fromCalled).toBe(0)
  expect(toCalled).toBe(1)

  inputInstance.simulate('change', { target: { value: 'Tim' } })
  expect(container.root.instance().stateTree.get('fullName')).toEqual({ name: 'Tim-Doe' })
  expect(fromCalled).toBe(1)
  expect(toCalled).toBe(1)

  stateTree.set('fullName.name', 'Tim-Dunken')
  expect(inputInstance.prop('value')).toBe('Tim')
  expect(secondInputInstance.prop('value')).toBe('Dunken')

  expect(toCalled).toBe(2)
  expect(fromCalled).toBe(1)
})
