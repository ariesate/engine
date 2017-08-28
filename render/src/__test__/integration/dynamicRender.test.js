import React from 'react'
import PropTypes from 'prop-types'
import { mount } from 'enzyme'
import connect from '../../connect'
import { mapValues } from '../../util'
import Render from '../../Render'
import createStateTree from '../../createStateTree'
import createAppearance from '../../createAppearance'
import createBackground from '../../createBackground'
import applyStateTreeSubscriber from '../../applyStateTreeSubscriber'
import createDynamicRender from '../../createDynamicRender'
import * as stateTreeBackground from '../../background/utility/stateTree'
import * as interpolationJob from '../../background/job/interpolation'

function createButton() {
  let rendered = 0
  const Component = {
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
      rendered += 1
      return <button onClick={listeners.onClick}>{state.clicked}</button>
    },
  }

  return {
    Component,
    getRendered() {
      return rendered
    },
  }
}

function createInput() {
  let rendered = 0
  const Component = {
    stateTypes: {
      value: PropTypes.string,
    },
    getDefaultState: () => ({
      value: '',
    }),
    defaultListeners: {
      onChange(_, e) {
        return {
          value: e.target.value,
        }
      },
    },
    render({ listeners, state }) {
      rendered += 1
      return <input onChange={listeners.onChange} value={state.value} />
    },
  }

  return {
    Component,
    getRendered() {
      return rendered
    },
  }
}

const backgroundDef = {
  utilities: {
    stateTree: stateTreeBackground,
  },
  jobs: {
    interpolation: interpolationJob,
  },
}

const DynamicRender = createDynamicRender(
  applyStateTreeSubscriber(createStateTree),
  createAppearance,
  createBackground,
  backgroundDef,
)

let stateTree
let appearance

beforeEach(() => {
  stateTree = applyStateTreeSubscriber(createStateTree)({})
  appearance = createAppearance()
})

describe('render', () => {
  const Button = createButton()
  const Input = createInput()

  const components = mapValues({ Button: Button.Component, Input: Input.Component, DynamicRender }, connect)

  const config = {
    children: [{
      type: 'DynamicRender',
      bind: 'dynamic',
    }],
  }

  test('without initialState', () => {
    const container = mount(
      <Render
        stateTree={stateTree}
        appearance={appearance}
        components={components}
        background={createBackground(backgroundDef, stateTree, appearance)}
        config={config}
      />,
    )
    expect(container.root.html()).toBe('<div><div><div><div><div></div></div></div></div></div>')
  })

  test('with initialState', () => {
    const initialState = {
      dynamic: {
        config: {
          children: [{
            type: 'Input',
            getInitialState: () => ({
              value: 'test',
            }),
          }, {
            type: 'Button',
          }],
        },
      },
    }

    const container = mount(
      <Render
        stateTree={applyStateTreeSubscriber(createStateTree)(initialState)}
        appearance={appearance}
        components={components}
        background={createBackground(backgroundDef, stateTree, appearance)}
        config={config}
      />,
    )
    expect(container.root.html()).toBe('<div><div><div><div><div><div><input value="test"></div><div><button>0</button></div></div></div></div></div></div>')
  })
})


describe('change', () => {
  let container
  let Input
  let Button
  let components
  beforeEach(() => {
    Button = createButton()
    Input = createInput()

    components = mapValues({ Button: Button.Component, Input: Input.Component, DynamicRender }, connect)

    const config = {
      children: [{
        type: 'DynamicRender',
        bind: 'dynamic',
      }],
    }

    container = mount(
      <Render
        stateTree={stateTree}
        appearance={appearance}
        components={components}
        background={createBackground(backgroundDef, stateTree, appearance)}
        config={config}
      />,
    )
  })

  test('render right', () => {
    expect(container.root.html()).toBe('<div><div><div><div><div></div></div></div></div></div>')
  })

  test('config change', () => {
    stateTree.merge('dynamic.config', {
      type: 'Input',
      bind: 'i1',
    })

    expect(container.root.html()).toBe('<div><div><div><div><input value=""></div></div></div></div>')
    expect(container.find(components.DynamicRender).node.instance.stateTree.get()).toEqual({ i1: { value: '' } })
  })

  test('value change from outside', () => {
    stateTree.merge('dynamic.config', {
      type: 'div',
      children: [{
        type: 'Input',
        bind: 'i1',
      }, {
        type: 'Button',
      }],
    })

    stateTree.merge('dynamic.value', {
      i1: {
        value: 'test',
      },
    })

    expect(container.find(components.DynamicRender).node.instance.stateTree.get('i1')).toEqual({ value: 'test' })
    // 渲染性能测试
    expect(Button.getRendered()).toBe(1)
    expect(Input.getRendered()).toBe(2)
  })

  test('value change from inside', () => {
    stateTree.merge('dynamic.config', {
      type: 'div',
      children: [{
        type: 'Input',
        bind: 'i1',
      }, {
        type: 'Button',
      }],
    })

    const inputNode = container.find(components.DynamicRender).find('input')
    inputNode.simulate('change', { target: { value: 'changed' } })

    expect(container.find(components.DynamicRender).node.instance.stateTree.get('i1')).toEqual({ value: 'changed' })

    expect(Button.getRendered()).toBe(2)
    expect(Input.getRendered()).toBe(2)
  })

  test('change with mapBackgroundToState', () => {

  })
})
