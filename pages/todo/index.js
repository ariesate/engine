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
import * as businessBackground from '@cicada/render/lib/background/utility/business'
import * as mapBackgroundToStateJob from '@cicada/render/lib/background/job/mapBackgroundToState'
import * as visibleJob from '@cicada/render/lib/background/job/visibility'

import * as Input from './Input'
import * as Checkbox from './Checkbox'
import * as TodoList from './TodoList'
import * as Button from './Button'
import * as Todo from './Todo'

const C = mapValues({ Input, Checkbox, TodoList, Todo, Button }, connect)

const stateTree = applyStateTreeSubscriber(createStateTree)()
const appearance = createAppearance()

window.stateTree = stateTree

const background = createBackground({
  utilities: {
    validation: validationBackground,
    stateTree: stateTreeBackground,
    appearance: appearanceBackground,
    listener: listenerBackground,
    business: businessBackground,
  },
  jobs: {
    mapBackgroundToState: mapBackgroundToStateJob,
    visible: visibleJob,
  },
}, stateTree, appearance)

let globalKey = 0

function createUniqueKey() {
  return String(globalKey++)
}


function addOne({ stateTree: innerStateTree, business }) {
  business.set('showFlag', 'All')
  const items = innerStateTree.get('todoList.items').slice()
  const key = createUniqueKey()
  const todoInput = stateTree.get('todoInput.value')
  items.push({ key, todo: { text: todoInput } })
  stateTree.merge('todoList.items', items)
}

function markCompleted({ state, stateTree: innerStateTree, statePath }) {
  innerStateTree.merge(statePath, { completed: state.completed !== true })
}

function showVisible({ state, business }) {
  const flag = business.get('showFlag')
  if (flag === 'All') return true
  if (flag === 'Completed') {
    if (state.completed === true) return true
  }
  if (flag === 'NotCompleted') {
    if (state.completed === false) return true
  }
  return false
}

function toggleAllCompleted({ stateTree: innerStateTree, business }) {
  const items = innerStateTree.get('todoList.items').slice()
  const newItems = items.map((item) => {
    const todo = item.todo
    todo.completed = true
    return {
      todo,
      key: item.key,
    }
  })
  innerStateTree.merge('todoList.items', newItems)
  business.set('showFlag', 'All')
}
function showCompleted({ business }) {
  business.set('showFlag', 'Completed')
}
function showNotCompleted({ business }) {
  business.set('showFlag', 'NotCompleted')
}

function showAll({ business }) {
  business.set('showFlag', 'All')
}


ReactDom.render(
  <Render
    stateTree={stateTree}
    appearance={appearance}
    background={background}
  >
    <div>
      <C.Input bind="todoInput" getInitialState={() => ({ label: '任务' })} />
      <C.Button getInitialState={() => ({ text: '添加' })} listeners={{ onClick: { fns: [{ fn: addOne }] } }} />
      <C.TodoList bind="todoList">
        <C.Todo
          bind="todo"
          getInitialState={() => ({
            text: 'task',
            completed: false,
          })}
          listeners={{
            onTodoClick: {
              fns: [{
                fn: markCompleted,
              }],
            },
          }}
          visible={[showVisible]}
        />
      </C.TodoList>
      <C.Button getInitialState={() => ({ text: '已完成' })} listeners={{ onClick: { fns: [{ fn: showCompleted }] } }} />
      <C.Button getInitialState={() => ({ text: '未完成' })} listeners={{ onClick: { fns: [{ fn: showNotCompleted }] } }} />
      <C.Button getInitialState={() => ({ text: '全部' })} listeners={{ onClick: { fns: [{ fn: showAll }] } }} />
      <C.Button bind="show" getInitialState={() => ({ text: '标记全部已完成' })} listeners={{ onClick: { fns: [{ fn: toggleAllCompleted }] } }} />
    </div>
  </Render>,
  document.getElementById('root'),
)
