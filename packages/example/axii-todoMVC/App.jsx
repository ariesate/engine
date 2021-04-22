/**@jsx createElement*/
import {
  createElement,
  reactive,
  atom,
  atomComputed,
  computed,
} from 'axii'
import TodoInput from './TodoInput'
import Todo from './Todo'
import Filter from './Filter'

export const TODO_TYPES = ['all', 'uncompleted', 'completed']

const createId = (function() {
  let i = 0
  return () => i++
})()

function randomTodos() {
  const result = []
  for(let i = 0; i< 10; i++) {
    TODO_TYPES.slice(1).forEach(type => {
      result.push({
        id: createId(),
        content: `${type}-${i}`,
        type
      })
    })
  }
  return result
}



export function App() {
  const todos = reactive(randomTodos())
  const todoType = atom(TODO_TYPES[1])
  const visibleTodos = computed(() => todos.filter((todo) => {
    return todoType.value === TODO_TYPES[0] ? true: (todo.type === todoType.value)
  }))

  const onAddSubmit = (nextProps, prevProps) => {
    const { content } = prevProps
    todos.unshift({
      id: createId(),
      content: content.value,
      type: TODO_TYPES[1]
    })
  }

  const onDelete = (nextProp, { item }) => {
    todos.splice(todos.findIndex(t => t.id === item.id), 1)
  }

  const changeType = (type) => {
    todoType.value = type
  }

  return (
    <div>
      <div>这个 todoMVC 是用来演示 Axii 的基本组件结构、reactive data 的实现的。</div>
      <div>说明：输入完按回车能提交</div>
      <TodoInput onAddSubmit={onAddSubmit} />
      {() => {
        return visibleTodos.map(todo => {
          return <Todo key={todo.id} item={todo} onDelete={onDelete} />
        })
      }}
      <div>过滤器：</div>
      {TODO_TYPES.map((type) => (
        <span key={type}>
          <input type="radio" name={type}
           checked={atomComputed(() => todoType.value ===type)}
           onClick={() => changeType(type)}
          />
          <label for={type}>{type}</label>
        </span>
      ))}
    </div>
  )
}

