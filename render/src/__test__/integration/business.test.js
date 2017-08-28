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
import * as businessBackground from '../../background/utility/business'
import * as mapBackgroundToStateJob from '../../background/job/mapBackgroundToState'

const DemoInput = {
  initialize() {
    return {
      rendered: 0,
    }
  },
  stateTypes: {
    value: PropTypes.string,
  },
  getDefaultState: () => ({
    value: '',
  }),
  render({ state, instance }) {
    instance.rendered += 1
    return (
      <div>
        <input value={state.value} />
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
  const config = {
    children: [{
      type: 'Input',
      bind: 'firstName',
      mapBackgroundToState: [({ business }) => {
        return {
          value: business.get('fullName', '').split(' ')[0] || '',
        }
      }],
    }, {
      type: 'Input',
      bind: 'secondName',
      mapBackgroundToState: [({ business }) => {
        return {
          value: business.get('fullName', '').split(' ')[1] || '',
        }
      }],
    }],
  }

  const Input = connect(DemoInput, 'Input')

  const container = mount(<Render
    stateTree={stateTree}
    components={{ Input }}
    config={config}
    background={createBackground({
      utilities: {
        business: businessBackground,
      },
      jobs: {
        mapBackgroundToState: mapBackgroundToStateJob,
      },
    }, stateTree, appearance)}
  />)

  const secondInput = container.find(Input).at(1)
  // 注意，这里会 render 两次是因为 mapBg 在 mount 后会默认执行一次
  expect(secondInput.node.instance.rendered).toBe(2)

  container.instance().background.instances.business.set('fullName', 'Jane Doe')

  expect(secondInput.node.instance.rendered).toBe(3)
  expect(stateTree.get()).toEqual({
    firstName: { value: 'Jane' },
    secondName: { value: 'Doe' },
  })

  expect(secondInput.find('input').prop('value')).toBe('Doe')
})
