import React from 'areact'
import TodoItem from './TodoItem'
import TodoFooter from './TodoFooter'
import {
  ALL_TODOS,
  ACTIVE_TODOS,
  COMPLETED_TODOS,
  ENTER_KEY,
} from './constant';
import {getUniqueId, update} from './util';


export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newTodo: '',
      editing: null,
      nowShowing: ALL_TODOS,
      todos: [{
        id: getUniqueId(),
        title: 'finish todoMVC',
        completed: false,
        editing: false,
      }, {
        id: getUniqueId(),
        title: 'finish todoMVC2',
        completed: false,
        editing: false,
      }, {
        id: getUniqueId(),
        title: 'finish todoMVC3',
        completed: false,
        editing: false,
      }]
    }
  }

  toggle = (id) => {
    const todos = update(this.state.todos, {id}, (item) => {
      return {...item, completed: !item.completed}
    })
    this.setState({ todos })
  }

  destroy = (id) => {
    const todos = this.state.todos.filter(item => item.id !== id)
    this.setState({ todos })
  }
  edit = (id) => {
    this.setState({editing: id})
  }
  save = (id, title) => {
    const todos = update(this.state.todos, {id}, (item) => {
      return {...item, title}
    })
    this.setState({ todos, editing: null })
  }
  cancel = () => {
    this.setState({editing: null})
  }
  handleChange = (event) => {
    if (event.keyCode === ENTER_KEY) {
      return;
    }

    this.setState({newTodo: event.target.value});
  }
  handleNewTodoKeyDown = (event) => {
    if (event.keyCode !== ENTER_KEY) {
      return;
    }

    event.preventDefault();

    const title = this.state.newTodo.trim();

    if (title) {
      this.setState({
        todos: this.state.todos.concat({
          id: getUniqueId(),
          title,
        })
      })
      this.setState({newTodo: ''});
    }
  }
  changeFilter = (filter) => {
    this.setState({nowShowing: filter})
  }
  clearCompleted = () => {
    this.setState({todos: this.state.todos.filter(todo => !todo.completed)});
  }
  render() {
    const todos = this.state.todos;

    const shownTodos = todos.filter((todo) => {
      switch (this.state.nowShowing) {
        case ACTIVE_TODOS:
          return !todo.completed;
        case COMPLETED_TODOS:
          return todo.completed;
        default:
          return true;
      }
    }, this);

    const todoItems = shownTodos.map((todo) => {
      return (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={this.toggle}
          onDestroy={this.destroy}
          onEdit={this.edit}
          editing={this.state.editing === todo.id}
          onSave={this.save}
          onCancel={this.cancel}
        />
      );
    }, this);

    const activeTodoCount = todos.reduce((accum, todo) => {
      return todo.completed ? accum : accum + 1;
    }, 0);

    const completedCount = todos.length - activeTodoCount;

    let footer = null
    if (activeTodoCount || completedCount) {
      footer =
        <TodoFooter
          count={activeTodoCount}
          completedCount={completedCount}
          nowShowing={this.state.nowShowing}
          onClearCompleted={this.clearCompleted}
          onChange={this.changeFilter}
        />;
    }

    let main = null
    if (todos.length) {
      main = (
        <section className="main">
          <input
            id="toggle-all"
            className="toggle-all"
            type="checkbox"
            onChange={this.toggleAll}
            checked={activeTodoCount === 0}
          />
          <label
            htmlFor="toggle-all"
          />
          <ul className="todo-list">
            {todoItems}
          </ul>
        </section>
      );
    }

    return (
      <div>
        <header className="header">
          <h1>todos</h1>
          <input
            className="new-todo"
            placeholder="What needs to be done?"
            value={this.state.newTodo}
            onKeyDown={this.handleNewTodoKeyDown}
            onKeyUp={this.handleChange}
            autoFocus={true}
          />
        </header>
        {main}
        {footer}
      </div>
    );
  }
}
