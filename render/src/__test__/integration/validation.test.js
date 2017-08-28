/* eslint-disable react/no-multi-comp */
import React from 'react'
import PropTypes from 'prop-types'
import { mount } from 'enzyme'
import Render from '../../Render'
import createStateTree from '../../createStateTree'
import applyStateTreeSubscriber from '../../applyStateTreeSubscriber'
import connect from '../../connect'
import createBackground from '../../createBackground'
import * as listenerBackground from '../../background/utility/listener'
import * as validationBackground from '../../background/utility/validation'
import * as stateTreeBackground from '../../background/utility/stateTree'
import * as appearanceBackground from '../../background/utility/appearance'
import * as mapBackgroundToStateJob from '../../background/job/mapBackgroundToState'
import Scope from '../../components/Scope'
import { Interface } from '../../background/utility/form'
import createAppearance from '../../createAppearance'

const DemoInput = {
  initialize() {
    return {
      rendered: 0,
    }
  },
  stateTypes: {
    value: PropTypes.string,
    status: PropTypes.string,
    help: PropTypes.string,
    id: PropTypes.string,
  },
  implement: [Interface.item],
  getDefaultState: () => ({
    value: '',
    status: 'normal',
    help: '',
    id: undefined,
  }),
  defaultListeners: {
    onChange({ state }, e) {
      return {
        ...state,
        value: e.target.value,
      }
    },
  },
  render({ state, listeners, instance }) {
    instance.rendered += 1
    return (
      <div>
        <input value={state.value} onChange={listeners.onChange} id={state.id} />
        <div>{state.status}: {state.help}</div>
      </div>
    )
  },
}

let stateTree = null
let appearance = null
beforeEach(() => {
  stateTree = applyStateTreeSubscriber(createStateTree)({})
  appearance = createAppearance()
})

test('basic validation', () => {
  const bind = 'i1'
  const config = {
    type: 'Input',
    bind,
    validator: {
      onChange: [{
        fn({ stateTree: stateTreeBg, statePath }) {
          return {
            type: stateTreeBg.get(statePath).value.length > 3 ? 'error' : 'success',
            help: stateTreeBg.get(statePath).value.length > 3 ? 'too long' : 'ok',
          }
        },
      }],
    },
  }

  const Input = connect(DemoInput, 'Input')

  const container = mount(<Render
    stateTree={stateTree}
    components={{ Input }}
    config={config}
    background={createBackground({
      utilities: {
        validation: validationBackground,
        stateTree: stateTreeBackground,
      },
    }, stateTree, appearance)}
  />)

  const inputInstance = container.find(Input).first().node
  // 用 instance 记录render次数来测试是否发生了重复 render
  expect(inputInstance.instance.rendered).toBe(1)
  // 验证结果正确
  const inputNode = container.find('input')
  // 模拟输入
  inputNode.simulate('change', { target: { value: 'f' } })

  expect(inputInstance.instance.rendered).toBe(2)
  expect(stateTree.get(bind)).toEqual({ value: 'f', status: 'success', help: 'ok' })
  inputNode.simulate('change', { target: { value: 'long' } })
  expect(inputInstance.instance.rendered).toBe(3)
  expect(stateTree.get(bind)).toEqual({ value: 'long', status: 'error', help: 'too long' })

  expect(container.find('input').prop('value')).toBe('long')
  expect(container.text()).toBe('error: too long')
})

test('combined validation', () => {
  const stateTreeWithInitial = applyStateTreeSubscriber(createStateTree)({
    name1: {},
    name2: {},
  })

  const onChange = [{
    fn({ stateTree: innerStateTree, statePath }) {
      const type = innerStateTree.get(statePath.relative('<-.name1')).value.length + innerStateTree.get(statePath.relative('<-.name2')).value.length > 3 ? 'error' : 'success'
      return { type }
    },
    group: 'all',
  }]

  const config = {
    type: 'div',
    children: [{
      type: 'Input',
      bind: 'name1',
      validator: {
        onChange,
      },
    }, {
      type: 'Input',
      bind: 'name2',
      validator: {
        onChange,
      },
    }],
  }

  const Input = connect(DemoInput, 'Input')

  const container = mount(<Render
    stateTree={stateTreeWithInitial}
    components={{ Input }}
    config={config}
    background={createBackground({
      utilities: {
        validation: validationBackground,
        stateTree: stateTreeBackground,
      },
    }, stateTreeWithInitial, appearance)}
  />)

  // 验证结果正确
  const firstInput = container.find('input').at(0)
  firstInput.simulate('change', { target: { value: 'ff' } })
  expect(stateTreeWithInitial.get()).toEqual({
    name1: { value: 'ff', status: 'success', help: '', id: undefined },
    name2: { value: '', status: 'success', help: '', id: undefined },
  })

  const secondInput = container.find('input').at(1)
  secondInput.simulate('change', { target: { value: 'dd' } })

  expect(stateTreeWithInitial.get()).toEqual({
    name1: { value: 'ff', status: 'error', help: '' },
    name2: { value: 'dd', status: 'error', help: '' },
  })
})

test('sync validation plus async validation', async () => {
  const stateTreeWithInitial = applyStateTreeSubscriber(createStateTree)({
    name1: {},
  })

  let innerPromise

  const onChange = [{
    fn({ state }) {
      innerPromise = new Promise((resolve) => {
        const isValid = state.value !== 'exist'
        setTimeout(() => {
          resolve({
            type: isValid ? 'success' : 'error',
            help: isValid ? '' : 'already exist',
          })
        }, 20)
      })
      return innerPromise
    },
  }, {
    fn({ state }) {
      const isValid = state.value.length > 3
      return {
        type: isValid ? 'success' : 'error',
        help: isValid ? '' : 'too short',
      }
    },
  }]

  const config = {
    type: 'div',
    children: [{
      type: 'Input',
      bind: 'name1',
      validator: {
        onChange,
      },
    }],
  }

  const Input = connect(DemoInput, 'Input')

  const container = mount(<Render
    stateTree={stateTreeWithInitial}
    components={{ Input }}
    config={config}
    background={createBackground({
      utilities: {
        validation: validationBackground,
        stateTree: stateTreeBackground,
      },
    }, stateTreeWithInitial, appearance)}
  />)

  function timeout(time) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, time)
    })
  }

  // 输入一个太短的值
  const firstInput = container.find('input').at(0)
  firstInput.simulate('change', { target: { value: 'ff' } })
  // await innerPromise
  await timeout(100)
  expect(stateTreeWithInitial.get()).toEqual({
    name1: { value: 'ff', status: 'error', help: 'too short', id: undefined },
  })

  // 输入一个已有的值
  firstInput.simulate('change', { target: { value: 'exist' } })

  // await innerPromise
  await timeout(100)
  expect(stateTreeWithInitial.get()).toEqual({
    name1: { value: 'exist', status: 'error', help: 'already exist' },
  })

  // 输入一个正确值
  firstInput.simulate('change', { target: { value: 'notExist' } })

  // await innerPromise
  await timeout(100)
  expect(stateTreeWithInitial.get()).toEqual({
    name1: { value: 'notExist', status: 'success', help: '' },
  })
})

test('validation with scope', () => {
  const onChange = [{
    fn({ stateTree: innerStateTree, statePath }) {
      const type = innerStateTree.get(statePath.relative('<-.name1')).value.length + innerStateTree.get(statePath.relative('<-.name2')).value.length > 3 ? 'error' : 'success'
      return { type }
    },
    group: 'all',
  }]

  const config = {
    children: [{
      type: 'Scope',
      relativeChildStatePath: 'child1',
      children: [{
        children: [{
          type: 'Input',
          bind: 'name1',
          validator: {
            onChange,
          },
          getInitialState: () => ({ id: 'input1' }),
        }, {
          type: 'Input',
          bind: 'name2',
          validator: {
            onChange,
          },
          getInitialState: () => ({ id: 'input2' }),
        }],
      }],
    }, {
      type: 'Scope',
      relativeChildStatePath: 'child2',
      children: [{
        children: [{
          type: 'Input',
          bind: 'name1',
          validator: {
            onChange,
          },
          getInitialState: () => ({ id: 'input3' }),
        }, {
          type: 'Input',
          bind: 'name2',
          validator: {
            onChange,
          },
          getInitialState: () => ({ id: 'input4' }),
        }],
      }],
    }],
  }

  const Input = connect(DemoInput, 'Input')

  const container = mount(<Render
    stateTree={stateTree}
    components={{ Input, Scope }}
    config={config}
    background={createBackground({
      utilities: {
        validation: validationBackground,
        stateTree: stateTreeBackground,
      },
    }, stateTree, appearance)}
  />)

  // // 验证结果正确
  const firstInput = container.find('#input1').at(0)
  firstInput.simulate('change', { target: { value: 'aa' } })
  expect(stateTree.get()).toEqual({
    child1: {
      name1: { value: 'aa', status: 'success', help: '', id: 'input1' },
      name2: { value: '', status: 'success', help: '', id: 'input2' },
    },
    child2: {
      name1: { value: '', status: 'normal', help: '', id: 'input3' },
      name2: { value: '', status: 'normal', help: '', id: 'input4' },
    },
  })

  const secondInput = container.find('#input2').at(0)
  secondInput.simulate('change', { target: { value: 'bb' } })
  expect(stateTree.get()).toEqual({
    child1: {
      name1: { value: 'aa', status: 'error', help: '', id: 'input1' },
      name2: { value: 'bb', status: 'error', help: '', id: 'input2' },
    },
    child2: {
      name1: { value: '', status: 'normal', help: '', id: 'input3' },
      name2: { value: '', status: 'normal', help: '', id: 'input4' },
    },
  })

  const thirdInput = container.find('#input3').at(0)
  thirdInput.simulate('change', { target: { value: 'cc' } })
  expect(stateTree.get()).toEqual({
    child1: {
      name1: { value: 'aa', status: 'error', help: '', id: 'input1' },
      name2: { value: 'bb', status: 'error', help: '', id: 'input2' },
    },
    child2: {
      name1: { value: 'cc', status: 'success', help: '', id: 'input3' },
      name2: { value: '', status: 'success', help: '', id: 'input4' },
    },
  })

  const forthInput = container.find('#input4').at(0)
  forthInput.simulate('change', { target: { value: 'dd' } })
  expect(stateTree.get()).toEqual({
    child1: {
      name1: { value: 'aa', status: 'error', help: '', id: 'input1' },
      name2: { value: 'bb', status: 'error', help: '', id: 'input2' },
    },
    child2: {
      name1: { value: 'cc', status: 'error', help: '', id: 'input3' },
      name2: { value: 'dd', status: 'error', help: '', id: 'input4' },
    },
  })
})

describe('validation state, query', () => {
  test('specific query', () => {
    const bind = 'i1'
    const config = {
      type: 'Input',
      bind,
      validator: {
        onChange: [{
          fn({ state }) {
            return {
              type: state.value.length > 3 ? 'error' : 'success',
              help: state.value.length > 3 ? 'too long' : 'ok',
            }
          },
        }],
      },
    }

    const Input = connect(DemoInput, 'Input')

    const container = mount(<Render
      stateTree={stateTree}
      appearance={appearance}
      components={{ Input }}
      config={config}
      background={createBackground({
        utilities: {
          validation: validationBackground,
          stateTree: stateTreeBackground,
          appearance: appearanceBackground,
        },
      }, stateTree, appearance)}
    />)

    expect(container.instance().background.instances.validation.isValid(bind)).toBe(false)
    expect(container.instance().background.instances.validation.isValid(bind, true)).toBe(true)

    const inputInstance = container.find(Input).first().node
    // 用 instance 记录render次数来测试是否发生了重复 render
    expect(inputInstance.instance.rendered).toBe(1)
    // 验证结果正确
    const inputNode = container.find('input')
    // 模拟输入
    inputNode.simulate('change', { target: { value: 'long' } })

    expect(container.instance().background.instances.validation.isValid(bind)).toBe(false)
  })

  test('recursive query', () => {
    const bind = 'i1'
    const config = {
      type: 'Input',
      bind,
      validator: {
        onChange: [{
          fn({ state }) {
            return {
              type: state.value.length > 3 ? 'error' : 'success',
              help: state.value.length > 3 ? 'too long' : 'ok',
            }
          },
        }],
      },
    }

    const Input = connect(DemoInput, 'Input')

    const container = mount(<Render
      stateTree={stateTree}
      appearance={appearance}
      components={{ Input }}
      config={config}
      background={createBackground({
        utilities: {
          validation: validationBackground,
          stateTree: stateTreeBackground,
          appearance: appearanceBackground,
        },
      }, stateTree, appearance)}
    />)

    expect(container.instance().background.instances.validation.isValid('')).toBe(false)
    expect(container.instance().background.instances.validation.isValid('', true)).toBe(true)

    // 验证结果正确
    const inputNode = container.find('input')
    // 模拟输入
    inputNode.simulate('change', { target: { value: 'ffff' } })

    expect(container.instance().background.instances.validation.isValid(bind)).toBe(false)
  })

  test('query work with mapBackgroundToState', () => {
    const bind = 'i0'
    const bind2 = 'i1'
    const config = {
      children: [{
        type: 'Input',
        bind,
        validator: {
          onChange: [{
            fn({ state }) {
              return {
                type: state.value.length > 3 ? 'error' : 'success',
                help: state.value.length > 3 ? 'too long' : 'ok',
              }
            },
          }],
        },
      }, {
        type: 'Input',
        bind: bind2,
        mapBackgroundToState: [({ validation }) => {
          return {
            value: String(validation.isValid('')),
          }
        }],
      }],
    }

    const Input = connect(DemoInput, 'Input')
    const container = mount(<Render
      stateTree={stateTree}
      appearance={appearance}
      components={{ Input }}
      config={config}
      background={createBackground({
        utilities: {
          validation: validationBackground,
          stateTree: stateTreeBackground,
          appearance: appearanceBackground,
        },
        jobs: {
          mapBackgroundToState: mapBackgroundToStateJob,
        },
      }, stateTree, appearance)}
    />)

    const inputNode = container.find('input').at(0)
    // 模拟输入
    inputNode.simulate('change', { target: { value: 'ffff' } })
    const secondInputNode = container.find('input').at(1)
    expect(secondInputNode.prop('value')).toBe('false')
  })

  test('query work with visible option', () => {
    const bind = 'i1'
    const config = {
      children: [{
        type: 'Input',
        bind,
        validator: {
          onChange: [{
            fn({ state }) {
              return {
                type: state.value.length > 3 ? 'error' : 'success',
                help: state.value.length > 3 ? 'too long' : 'ok',
              }
            },
          }],
        },
      }],
    }

    const Input = connect(DemoInput, 'Input')

    const container = mount(<Render
      stateTree={stateTree}
      components={{ Input }}
      appearance={appearance}
      config={config}
      background={createBackground({
        utilities: {
          validation: validationBackground,
          stateTree: stateTreeBackground,
          appearance: appearanceBackground,
        },
      }, stateTree, appearance)}
    />)

    const inputNode = container.find('input').at(0)
    // 模拟输入
    inputNode.simulate('change', { target: { value: 'ffff' } })

    expect(container.instance().background.instances.validation.isValid()).toBe(false)
    appearance.setVisibleById(stateTree.get(bind)._id, false)
    expect(container.instance().background.instances.validation.isValid()).toBe(true)
    expect(container.instance().background.instances.validation.isValid('', true, true)).toBe(false)
  })
})

