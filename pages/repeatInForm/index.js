import React from 'react'
import ReactDom from 'react-dom'
import connect from '@cicada/render/lib/connect'
import { mapValues } from '@cicada/render/lib/util'
import Render from '@cicada/render/lib/Render'
import createStateTree from '@cicada/render/lib/createStateTree'
import createAppearance from '@cicada/render/lib/createAppearance'


import applyStateTreeSubscriber from '@cicada/render/lib/applyStateTreeSubscriber'
import * as validationBackground from '@cicada/render/lib/background/utility/validation'
import * as stateTreeBackground from '@cicada/render/lib/background/utility/stateTree'
import * as appearanceBackground from '@cicada/render/lib/background/utility/appearance'
import createBackground from '@cicada/render/lib/createBackground'
import * as listenerBackground from '@cicada/render/lib/background/utility/listener'
import * as mapBackgroundToStateJob from '@cicada/render/lib/background/job/mapBackgroundToState'
import * as visibleJob from '@cicada/render/lib/background/job/visibility'
import { createUniqueIdGenerator } from './util'

import * as Input from './Input'
import * as Checkbox from './Checkbox'
import * as Repeat from './Repeat'
import * as Button from './Button'

const createRepeatKey = createUniqueIdGenerator('repeat')
const C = mapValues({ Input, Checkbox, Repeat, Button }, connect)

const stateTree = applyStateTreeSubscriber(createStateTree)()
const appearance = createAppearance()

window.stateTree = stateTree

const validators = {
  notEmpty({ state }) {
    const isValid = state.value.trim() !== ''
    return {
      type: isValid ? 'success' : 'error',
      help: isValid ? '' : '不能为空',
    }
  },
  notTooShort({ state }) {
    const isValid = state.value.length > 3
    return {
      type: isValid ? 'success' : 'error',
      help: isValid ? '' : '太短',
    }
  },
  notTooLong({ state }) {
    const isValid = state.value().length > 10
    return {
      type: isValid ? 'success' : 'error',
      help: isValid ? '' : '太长',
    }
  },
  notExist({ state }) {
    return new Promise((resolve) => {
      const isValid = state.value !== '王大锤'
      setTimeout(() => {
        resolve({
          type: isValid ? 'success' : 'error',
          help: isValid ? '' : '数据库里已有',
        })
      }, 300)
    })
  },
  notDotaAndLoL({ stateTree }) {
    const isValid = !(stateTree.get('hobby1.value') === 'Dota' && stateTree.get('hobby2.value') === 'LOL')
    return {
      type: isValid ? 'success' : 'error',
      help: isValid ? '' : '不能同时喜欢 Dota 和 LOL',
    }
  },
  notDotaAndLoLAsync({ stateTree }) {
    const isValid = !(stateTree.get('skill1.value') === 'Dota' && stateTree.get('skill2.value') === 'LOL')
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          type: isValid ? 'success' : 'error',
          help: isValid ? '' : '不能同时喜欢 Dota 和 LOL',
        })
      }, 300)
    })
  },
  notDifferent({ stateTree }) {
    const isValid = stateTree.get('password1.value') === stateTree.get('password2.value')
    return {
      type: isValid ? 'success' : 'error',
      help: isValid ? '' : '两次密码输入必须相同',
    }
  },
}

function addOne({ stateTree }) {
  const items = stateTree.get('group.items').slice()
  items.push({ key: createRepeatKey() })
  stateTree.set('group.items', items)
}

function strictValidation({ validation }) {
  const isValid = validation.isValid('')
  return { disabled: !isValid }
}

const config = {
  children: [{
    type: 'Repeat',
    bind: 'group',
    getInitialState: () => ({
      items: [{ key: createRepeatKey() }],
    }),
    children: [{
      type: 'Input',
      bind: 'name',
      mapBackgroundToState: [({ stateTree: stateTreeUtil }) => {
        return {
          value: stateTreeUtil.get('showAdvance.checked') ? 'good' : '',
        }
      }],
    }],
  }, {
    type: 'Button',
    listeners: {
      onClick: {
        fns: [{
          fn: addOne,
        }],
      },
    },
  }, {
    type: 'Checkbox',
    bind: 'showAdvance',
  }],
}

ReactDom.render(
  <Render
    stateTree={stateTree}
    appearance={appearance}
    background={createBackground({
      utilities: {
        validation: validationBackground,
        stateTree: stateTreeBackground,
        appearance: appearanceBackground,
        listener: listenerBackground,
      },
      jobs: {
        mapBackgroundToState: mapBackgroundToStateJob,
        visible: visibleJob,
      },
    }, stateTree, appearance)}
    components={C}
  >
    <div>
      <h3>Repeat 中的校验</h3>
      <C.Repeat bind="group" getInitialState={() => ({ items: [{ key: createRepeatKey() }] })}>
        <C.Input bind="name" getInitialState={() => ({ label: '姓名' })} validator={{ onChange: [{ fn: validators.notEmpty }] }} />
      </C.Repeat>
      <C.Button getInitialState={() => ({ text: '添加' })} listeners={{ onClick: { fns: [{ fn: addOne }] } }} />
      <C.Checkbox getInitialState={() => ({ text: '点我显示下面Input框' })} bind="showAdvance" />
    </div>
    <div>
      <C.Button getInitialState={() => ({ text: '强校验', type: 'primary', disabled: false })} mapBackgroundToState={[strictValidation]} />
      <C.Button getInitialState={() => ({ text: '重置' })} listeners={{ onClick: { fns: [{ fn({ validation }) { validation.reset('') } }] } }} />
    </div>

  </Render>,
  document.getElementById('root'),
)

