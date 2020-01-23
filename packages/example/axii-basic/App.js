import { createElement, render, reactiveExpression, reactive, ref, computed, propTypes, derive, effect } from 'axii'
import Input from './Input'
import Todo from './Todo'
import Filter from './Filter'
/**
 * 1. 当个组件的 vnode 更新和 data
 * 2. 传入的 data 更新的时候组件也要更新。
 * 3. render props 要能正确更新
 *
 */

function FullName({ fullName, onChange }) {
  const { firstName, secondName } = derive(() => {
    const splitArr =  computed(() => /-/.test(fullName.value) ? fullName.value.split('-') : [fullName.value, ''])
    return {
      firstName:() => splitArr.value[0],
      secondName: () => splitArr.value[1]
    }
  },({firstName, secondName}) => {
    return {
      fullName: () => `${firstName.value}-${secondName.value}`
    }
  })

  const createOnChange = (isFirst) => {
    return (e) => {
      onChange((props, state) => {
        const target = isFirst ? state.firstName : state.secondName
        target.value = e.target.value
      })
    }
  }

  return (
    <div>
      <input value={firstName} onInput={createOnChange(true)} />
      <input value={secondName} onInput={createOnChange(false)}/>
    </div>
  )
}

FullName.propTypes = {
  fullName: propTypes.string.default(() => ref('')),
  onChange: propTypes.func
}



export function App() {
  const todos = reactive([{ content: 'coding', type: 'active'}])
  const todoType = ref('active')
  // const showTodos = computed(() => todos.filter(({ type }) => type === todoType.value ) )

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

  const onFullNameChange = ({ fullName }) => {
    console.log({fullName })
  }

  const changeFullName = () => {
    fullName.value = 'wayne-ad'
  }

  const fullName = ref('john-titor')

  effect(() => {
    fullName.value = 'jhon-allen'
    console.log('running1')
  })

  effect(() => {
    fullName.value = '111-222'
    console.log('running2')
  })
  console.log("=======")
  fullName.value = '333-444'

  return (
    <div>
      <FullName fullName={fullName} onChange={onFullNameChange}/>
      <Input onAddSubmit={onAddSubmit} onTextChange={onTextChange}/>
      {computed(() => todos.map(todo => <Todo item={todo}/>))}
      {fullName}
      <button onClick={changeFullName} >change full name</button>
    </div>
  )
}

// 有个编辑态，还有 draft 状态。之前是怎么想的？？？？
