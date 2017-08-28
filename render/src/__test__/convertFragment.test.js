import React from 'react'
import PropTypes from 'prop-types'
import { mount } from 'enzyme'
import convertFragment from '../convertFragment'
import connect from '../connect'
import createStateTree from '../createStateTree'
import createAppearance from '../createAppearance'
import createBackground from '../createBackground'
import * as stateTreeUtility from '../background/utility/stateTree'
import * as listenerUtility from '../background/utility/listener'
import applyStateTreeSubscriber from '../applyStateTreeSubscriber'
import Render from '../Render'

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

test('convert fragment to a declarative component', () => {
  const fragment = {
    config: {
      type: 'Button',
      bind: 'button',
    },
  }

  const Button = connect(ButtonComponent, 'Button')
  const declarativeComponent = convertFragment(
    fragment,
    { Button },
    applyStateTreeSubscriber(createStateTree),
    createAppearance,
    createBackground,
    { utilities: { stateTree: stateTreeUtility } },
  )
  expect(typeof declarativeComponent.defaultListeners.onChange).toBe('function')
  expect(typeof declarativeComponent.render).toBe('function')
  expect(typeof declarativeComponent.stateTypes).toBe('object')
  expect(typeof declarativeComponent.getDefaultState).toBe('function')
})

test('converted fragment should render a controlled Render', () => {
  const fragment = {
    config: {
      type: 'Button',
      bind: 'button',
    },
  }

  const Button = connect(ButtonComponent, 'Button')
  let onChangeArgs = []
  const onChange = (...arg) => onChangeArgs = arg

  const { render } = convertFragment(
    fragment,
    applyStateTreeSubscriber(createStateTree),
    createAppearance,
    createBackground,
    { utilities: { stateTree: stateTreeUtility } },
  )
  const mock = {
    instance: {},
    listeners: {
      onChange,
    },
    context: {
      components: {
        Button,
      },
    },
  }
  const container = mount(render(mock))
  container.find('button').simulate('click')
  expect(typeof onChangeArgs[0].changeFn).toBe('function')
  expect(container.find(Render).root.instance().stateTree.get()).toEqual({ button: { clicked: 0 } })

  onChangeArgs[0].changeFn()

  expect(container.find(Render).root.instance().stateTree.get()).toEqual({ button: { clicked: 1 } })
  expect(container.html()).toBe('<div><button>1</button></div>')
})

test('converted fragment with right linkState', () => {
  const fragment = {
    config: {
      type: 'Button',
      bind: 'button',
    },
    linkState: {
      clickWithTail: {
        from({ stateTree }) {
          return `clicked_${stateTree.get('button.clicked')}`
        },
        to({ value }) {
          return {
            button: {
              clicked: parseInt(value.replace(/^clicked_/, ''), 10),
            },
          }
        },
        stateType: 'string',
        getDefaultValue: () => 'clicked_0',
      },
    },
  }

  const converted = convertFragment(
    fragment,
    applyStateTreeSubscriber(createStateTree),
    createAppearance,
    createBackground,
    { utilities: { stateTree: stateTreeUtility } },
  )
  expect(converted.stateTypes.clickWithTail).toBe(PropTypes.string)
  expect(converted.getDefaultState().clickWithTail).toBe('clicked_0')
})

describe('fragments render mode', () => {
  test('change signal come from inside', () => {
    let spyInstance = {}
    const SpyComponent = {
      render({ instance }) {
        spyInstance = instance
        instance.rendered = instance.rendered ? ++instance.rendered : 1
        return <div>{instance.rendered}</div>
      },
    }

    const fragment = {
      config: {
        children: [{
          type: 'Button',
          bind: 'button',
        }, {
          type: 'Spy',
          bind: 'spy',
        }],
      },
      linkState: {
        clickWithTail: {
          from({ stateTree }) {
            return `clicked_${stateTree.get('button.clicked')}`
          },
          to({ value }) {
            return {
              button: {
                clicked: parseInt(value.replace(/^clicked_/, ''), 10),
              },
            }
          },
          stateType: 'string',
          getDefaultValue: () => 'clicked_0',
        },
      },
    }

    const Button = connect(ButtonComponent, 'Button')
    const Spy = connect(SpyComponent, 'Spy')
    const finalCreateTree = applyStateTreeSubscriber(createStateTree)
    const ButtonAndSpy = connect(convertFragment(
      fragment,
      finalCreateTree,
      createAppearance,
      createBackground,
      { utilities: { stateTree: stateTreeUtility } },
    ), 'ButtonAndSpy')

    const container = mount(<Render
      config={{ type: 'ButtonAndSpy' }}
      components={{ Button, Spy, ButtonAndSpy }}
      stateTree={finalCreateTree()}
    />)
    expect(container.html()).toBe('<div><div><div><button>0</button></div><div><div>1</div></div></div></div>')
    const firstRenderSpyInstance = spyInstance
    const firstSpyInstance = container.find(Spy).root.instance()

    container.find('button').simulate('click')
    // instance 必须保证不变才有意义
    expect(firstRenderSpyInstance).toBe(spyInstance)
    expect(container.find(Spy).root.instance()).toBe(firstSpyInstance)
    expect(container.html()).toBe('<div><div><div><button>1</button></div><div><div>1</div></div></div></div>')
  })

  test('change signal come from outside', () => {
    let spyInstance = {}
    const SpyComponent = {
      stateTypes: {
        rendered: PropTypes.number,
      },
      getDefaultState: () => ({
        rendered: 0,
      }),
      render({ state, instance }) {
        spyInstance = instance
        instance.rendered = (instance.rendered !== undefined) ? ++instance.rendered : 1
        return <div>{state.rendered}</div>
      },
    }

    const fragment = {
      config: {
        children: [{
          type: 'Button',
          bind: 'button',
        }, {
          type: 'Spy',
          bind: 'spy',
        }],
      },
      linkState: {
        clickWithSpy: {
          from({ stateTree }) {
            return `${stateTree.get('button.clicked')}_${stateTree.get('spy.rendered')}`
          },
          to({ stateTree, value }) {
            const [clicked, rendered] = value.split('_')
            stateTree.merge('button', { clicked: parseInt(clicked, 10) })
            stateTree.merge('spy', { rendered: parseInt(rendered, 10) })
          },
          stateType: 'string',
          getDefaultValue: () => '0_0',
        },
      },
    }

    const Button = connect(ButtonComponent, 'Button')
    const Spy = connect(SpyComponent, 'Spy')
    const finalCreateTree = applyStateTreeSubscriber(createStateTree)
    const ButtonAndSpy = connect(convertFragment(
      fragment,
      finalCreateTree,
      createAppearance,
      createBackground,
      { utilities: { stateTree: stateTreeUtility } },
    ), 'ButtonAndSpy')

    const container = mount(<Render
      config={{ type: 'ButtonAndSpy', bind: 'buttonAndSpy' }}
      components={{ Button, Spy, ButtonAndSpy }}
      stateTree={finalCreateTree()}
    />)
    // 初始化
    expect(container.html()).toBe('<div><div><div><button>0</button></div><div><div>0</div></div></div></div>')
    const firstRenderSpyInstance = spyInstance
    const firstSpyInstance = container.find(Spy).root.instance()

    container.instance().stateTree.merge('buttonAndSpy', { clickWithSpy: '1_0' })
    // merge 之后， instance 必须保证不变才有意义
    expect(firstRenderSpyInstance).toBe(spyInstance)
    expect(container.find(Spy).root.instance()).toBe(firstSpyInstance)
    expect(spyInstance.rendered).toBe(2)
    // 验证 computeTo 是否执行正确并且触发了页面变化
    expect(container.html()).toBe('<div><div><div><button>1</button></div><div><div>0</div></div></div></div>')

    const secondRenderSpyInstance = spyInstance
    const secondSpyInstance = container.find(Spy).root.instance()

    container.instance().stateTree.merge('buttonAndSpy', { clickWithSpy: '1_1' })
    expect(secondRenderSpyInstance).toBe(spyInstance)
    expect(container.find(Spy).root.instance()).toBe(secondSpyInstance)
    expect(spyInstance.rendered).toBe(3)
    expect(container.html()).toBe('<div><div><div><button>1</button></div><div><div>1</div></div></div></div>')
  })
})


describe('expose listener', () => {
  const fragment = {
    config: {
      children: [{
        type: 'Button',
        bind: 'button',
      }],
    },
    exposeListener: {
      onButtonClick: {
        source: '0',
        listener: 'onClick',
      },
    },
  }

  const Button = connect(ButtonComponent, 'Button')
  const finalCreateTree = applyStateTreeSubscriber(createStateTree)
  const ButtonFrag = connect(convertFragment(
    fragment,
    finalCreateTree,
    createAppearance,
    createBackground,
    { utilities: { stateTree: stateTreeUtility } },
  ), 'ButtonFrag')

  let stateTree = null
  let background = null
  beforeEach(() => {
    stateTree = finalCreateTree()
    background = createBackground({
      utilities: { listener: listenerUtility },
    }, stateTree)
  })

  test('simple delegate', () => {
    let buttonClickFired = 0
    const onButtonClick = () => {
      buttonClickFired += 1
    }

    const config = {
      type: 'ButtonFrag',
      bind: 'buttonFrag',
      listeners: {
        onButtonClick: {
          fns: [{
            fn: onButtonClick,
          }],
        },
      },
    }

    const container = mount(<Render
      config={config}
      background={background}
      components={{ Button, ButtonFrag }}
      stateTree={stateTree}
    />)

    container.find('button').simulate('click')
    expect(buttonClickFired).toBe(1)
  })

  test('support preventDefault', () => {
    let buttonClickFired = 0
    const onButtonClick = () => {
      buttonClickFired += 1
    }

    const config = {
      type: 'ButtonFrag',
      bind: 'buttonFrag',
      listeners: {
        onButtonClick: {
          preventDefault: true,
          fns: [{
            fn: onButtonClick,
          }],
        },
      },
    }

    const container = mount(<Render
      config={config}
      background={background}
      components={{ Button, ButtonFrag }}
      stateTree={stateTree}
    />)
    container.find('button').simulate('click')
    expect(buttonClickFired).toBe(1)
    expect(container.find(ButtonFrag).at(0).node.instance.stateTree.get()).toEqual({ button: { clicked: 0 } })
  })

  test('support option before', () => {
    let buttonClickFired = 0
    let clickCopyFromListener = -1
    const onButtonClick = (_, { stateTree: innerStateTree }) => {
      clickCopyFromListener = innerStateTree.get('button.clicked')
      buttonClickFired += 1
    }

    const config = {
      type: 'ButtonFrag',
      bind: 'buttonFrag',
      listeners: {
        onButtonClick: {
          fns: [{
            before: true,
            fn: onButtonClick,
          }],
        },
      },
    }

    const container = mount(<Render
      config={config}
      components={{ Button, ButtonFrag }}
      background={background}
      stateTree={stateTree}
    />)
    container.find('button').simulate('click')
    expect(buttonClickFired).toBe(1)
    expect(clickCopyFromListener).toBe(0)
    expect(container.find(ButtonFrag).at(0).node.instance.stateTree.get()).toEqual({ button: { clicked: 1 } })
  })
})

// TODO 补上  initialState, didMount
