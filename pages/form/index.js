import React from 'react'
import ReactDom from 'react-dom'
import connect from '@cicada/render/lib/connect'
import { mapValues } from '@cicada/render/lib/util'
import Render from '@cicada/render/lib/Render'
import createStateTree from '@cicada/render/lib/createStateTree'
import createAppearance from '@cicada/render/lib/createAppearance'
import createBackground from '@cicada/render/lib/createBackground'
import applyStateTreeSubscriber from '@cicada/render/lib/applyStateTreeSubscriber'
import * as validationBackground from '@cicada/render/lib/background/utility/validation'
import * as stateTreeBackground from '@cicada/render/lib/background/utility/stateTree'
import * as appearanceBackground from '@cicada/render/lib/background/utility/appearance'
import * as listenerBackground from '@cicada/render/lib/background/utility/listener'
import * as mapBackgroundToStateJob from '@cicada/render/lib/background/job/mapBackgroundToState'
import * as visibleJob from '@cicada/render/lib/background/job/visibility'

import * as Input from './Input'
import * as Checkbox from './Checkbox'
import * as Repeat from './Repeat'
import * as Button from './Button'

const C = mapValues({ Input, Checkbox, Repeat, Button }, connect)

const stateTree = applyStateTreeSubscriber(createStateTree)()
const appearance = createAppearance()

window.stateTree = stateTree

// 纯函数用来验证
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
      const isValid = state.value !== '万万没想到'
      setTimeout(() => {
        resolve({
          type: isValid ? 'success' : 'error',
          help: isValid ? '' : '数据库里已有',
        })
      }, 300)
    })
  },
  notDotaAndLoL({ stateTree: innerStateTree }) {
    const isValid = !(innerStateTree.get('hobby1.value') === 'Dota' && innerStateTree.get('hobby2.value') === 'LOL')
    return {
      type: isValid ? 'success' : 'error',
      help: isValid ? '' : '不能同时喜欢 Dota 和 LOL',
    }
  },
  notDotaAndLoLAsync({ stateTree: innerStateTree }) {
    const isValid = !(innerStateTree.get('skill1.value') === 'Dota' && innerStateTree.get('skill2.value') === 'LOL')
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          type: isValid ? 'success' : 'error',
          help: isValid ? '' : '不能同时喜欢 Dota 和 LOL',
        })
      }, 300)
    })
  },
  notDifferent({ stateTree: innerStateTree }) {
    const isValid = innerStateTree.get('password1.value') === innerStateTree.get('password2.value')
    return {
      type: isValid ? 'success' : 'error',
      help: isValid ? '' : '两次密码输入必须相同',
    }
  },
}

function looseValidation({ validation }) {
  const isValid = validation.isValid('', true)
  return { disabled: !isValid }
}

// function strictValidation({ validation }) {
//   const isValid = validation.isValid('')
//   return { disabled: !isValid }
// }

const background = createBackground({
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
}, stateTree, appearance)

ReactDom.render(
  <Render
    stateTree={stateTree}
    appearance={appearance}
    background={background}
  >
    <div>
      <h3>自校验</h3>
      <C.Input bind="name" getInitialState={() => ({ label: '姓名' })} validator={{ onChange: [{ fn: validators.notEmpty }] }} />
    </div>
    <div>
      <h3>联合校验</h3>
      <p>爱好一写Dota，爱好二写LOL就会出错</p>
      <C.Input bind="hobby1" getInitialState={() => ({ label: '爱好一' })} validator={{ onChange: [{ fn: validators.notDotaAndLoL, group: 'hobby' }] }} />
      <C.Input bind="hobby2" getInitialState={() => ({ label: '爱好二' })} validator={{ onChange: [{ fn: validators.notDotaAndLoL, group: 'hobby' }] }} />
    </div>
    <div>
      <h3>自校验+联合验证</h3>
      <C.Input bind="password1" getInitialState={() => ({ label: '密码' })} validator={{ onChange: [{ fn: validators.notDifferent, group: 'password' }, { fn: validators.notTooShort }] }} />
      <C.Input bind="password2" getInitialState={() => ({ label: '确认密码' })} validator={{ onChange: [{ fn: validators.notDifferent, group: 'password' }, { fn: validators.notTooShort }] }} />
    </div>
    <div>
      <h3>异步校验</h3>
      <p>输入 万万没想到 会出错</p>
      <C.Input bind="nickName" getInitialState={() => ({ label: '昵称' })} validator={{ onChange: [{ fn: validators.notExist }] }} />
    </div>
    <div>
      <h3>自校验+异步校验</h3>
      <p>输入 万万没想到 会出错，又不能太短</p>
      <C.Input bind="nickName2" getInitialState={() => ({ label: '昵称' })} validator={{ onChange: [{ fn: validators.notExist }, { fn: validators.notTooShort }] }} />
    </div>
    <div>
      <h3>联合校验+异步校验</h3>
      <p>爱好一写Dota，爱好二写LOL就会出错。这一次是异步验证</p>
      <C.Input bind="skill1" getInitialState={() => ({ label: '技能一' })} validator={{ onChange: [{ fn: validators.notDotaAndLoLAsync, group: 'skill' }] }} />
      <C.Input bind="skill2" getInitialState={() => ({ label: '技能二' })} validator={{ onChange: [{ fn: validators.notDotaAndLoLAsync, group: 'skill' }] }} />
    </div>
    <div>
      <h3>隐藏部分</h3>
      <C.Checkbox getInitialState={() => ({ text: '点我显示下面Input框' })} bind="showAdvance" />
      <C.Input bind="advance" getInitialState={() => ({ label: '高级选项' })} visible={[({ stateTree: stateTreeUtil }) => {
        return stateTreeUtil.get('showAdvance.checked') === true
      }]} validator={{ onChange: [{ fn: validators.notEmpty }] }}
      />
    </div>
    <div>
      <C.Button getInitialState={() => ({ text: '按' })} listeners={{ onClick: { fns: [{ fn({ validation }) { alert(validation.isValid(undefined, true)) } }] } }} />
      <C.Button getInitialState={() => ({ text: '弱校验', type: 'primary', disabled: false })} mapBackgroundToState={[looseValidation]} />
      <C.Button getInitialState={() => ({ text: '重置' })} listeners={{ onClick: { fns: [{ fn({ validation }) { validation.reset('') } }] } }} />
    </div>

  </Render>, document.getElementById('root'),
)
