export function todo() {


  return (
    <div>
      <TodoInput />
      <TodoList />
      <TodoFilter />
    </div>
  )


  const tempTodo = ""
  const todoList = []

  return (
    <div>
      <TodoInput>
        {(verify) => {
          return <input onChange={verify} value={tempTodo}/>
        }}
      </TodoInput>
      <TodoList>
        {() => {
          return <div>...</div>
        }}
      </TodoList>
    </div>
  )

}
