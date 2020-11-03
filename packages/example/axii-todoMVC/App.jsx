import {
  createElement,
  reactive,
  ref,
  refComputed,
  computed,
} from 'axii'
import Input from './Input'
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
  const todoType = ref(TODO_TYPES[1])
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
      <div>这个 todoMVC 是用来演示 Axii 的基本组件结构、reactive data 的实现的。</div>
      <div>说明：输入完按回车能提交</div>
      <Input onAddSubmit={onAddSubmit} />
      {() => {
        const newList = visibleTodos.map(todo => {
          return <Todo key={todo.id} item={todo} onDelete={onDelete} />
        })
        console.log(visibleTodos)
        return newList
      }}
      <div>过滤器：</div>
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
