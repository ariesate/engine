import { createElement, render } from '@ariesate/render'
import * as mstMod from '@ariesate/render/noviceController/moduleSystem/modules/mst'
import Header from './Header'
import Main from './Main'
import Footer, { FILTER_ALL, FILTER_COMPLETED } from './Footer'

const { types, destroy, autorun } = mstMod

const createIdGenerator = () => {
  let index = 0
  return () => {
    index += 1
    return index
  }
}

const generateId = createIdGenerator()

/*
* define models
* */
const Todo = types.model('Todo', {
  content: types.string,
  completed: types.boolean,
  id: types.identifier(types.number),
}).actions((self) => {
  return {
    toggleComplete() { self.completed = !self.completed }
  }
})


const modelDefs = {
  TodoList: types.model({
    todos: types.array(Todo),
  }).actions((self) => {
    return {
      insert(content) {
        self.todos.unshift({
          id: generateId(),
          content,
          completed: false,
        })
      },
      remove(todo) { destroy(todo) },
    }
  }),
}

/*
* define app
* */
const headerListeners = {
  onChange({ state, mst: todoList }, e) {
    if (e.keyCode === 13) {
      todoList.insert(state.content)
      state.content = ''
    }
  },
}

const mainListeners = {
  toggleComplete(_, todo) {
    todo.toggleComplete()
  },
  onRemove({ mst }, todo) {
    mst.remove(todo)
  },
}

const mainMapMSTToState = ({ stateTree, mst }) => {
  return {
    list: mst.todos.filter((todo) => {
      return stateTree.filter.selected === FILTER_ALL ?
        true :
        stateTree.filter.selected === FILTER_COMPLETED ?
          todo.completed === true :
          todo.completed === false
    }),
  }
}

const footerMapMSTToState = ({ mst }) => {
  return {
    count: mst.todos.filter(todo => todo.completed === false).length,
  }
}

const todoMVC = (
  <div className="todoapp">
    <Header listeners={headerListeners} />
    <Main listeners={mainListeners} mapMSTToState={mainMapMSTToState} />
    <Footer bind="filter" mapMSTToState={footerMapMSTToState} />
  </div>
)

const initialState = {
  todos: [{
    content: 'learn mobX',
    id: generateId(),
    completed: true,
  }, {
    content: 'make todoMVC',
    id: generateId(),
    completed: false,
  }, {
    content: 'write docs',
    id: generateId(),
    completed: false,
  }],
}

const controller = render(
  todoMVC,
  document.getElementById('root'),
  { mst: { ...mstMod, argv: [{ rootType: 'TodoList', modelDefs, initialState }] } },
)

// for debug
window.controller = controller
