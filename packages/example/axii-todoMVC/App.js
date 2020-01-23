import {
  createElement,
  render,
  reactive,
  ref,
  refComputed,
  arrayComputed,
  propTypes,
  derive,
  effect
} from 'axii'
import Input from './Input'
import Todo from './Todo'
import Filter from './Filter'

const TODO_TYPES = ['all', 'uncompleted', 'completed']

function randomTodos() {
  const result = []
  for(let i = 0; i< 10; i++) {
    TODO_TYPES.slice(1).forEach(type => {
      result.push({
        id: `${type}-${i}`,
        content: `${type}-${i}`,
        type
      })
    })
  }
  return result
}

export function App() {
  const todos = reactive(randomTodos())
  const todoType = ref(TODO_TYPES[0])
  const showTodos = arrayComputed(() => todos.filter((todo) => {
    return todoType.value === TODO_TYPES[0] ? true: (todo.type === todoType.value)
  }))

  const onAddSubmit = (nextProps, prevProps) => {
    const { content } = prevProps
    todos.push({ content: content.value, type: 'active' })
  }

  const onTextChange = (next) => {
  }

  // 不允许两个同名的，这个逻辑放在那里？
  const onUpdateTodo = (nextTodo) => {
    // TODO checkUpdateTodo
    // TODO 如果需要异步处理怎么办？
  }

  const changeType = (type) => {
    todoType.value = type
  }

  return (
    <div>
      <Input onAddSubmit={onAddSubmit} onTextChange={onTextChange}/>
      {arrayComputed(() => {
        const newList = showTodos.map(todo => <Todo key={todo.id} item={todo}/>)
        console.log(newList.length)
        return newList
      })}
      {TODO_TYPES.map((type) => (
        <span key={type}>
          <input type="radio" name={type}
           checked={refComputed(() => todoType.value ===type)}
           onClick={() => changeType(type)}
          />
          <label for={type}>{type}</label>
        </span>
      ))}
    </div>
  )
}

// 有个编辑态，还有 draft 状态。之前是怎么想的？？？？
