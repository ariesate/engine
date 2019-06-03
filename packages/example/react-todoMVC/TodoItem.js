import React, { Component } from 'areact'
import classNames from 'classnames'
import { ESCAPE_KEY, ENTER_KEY } from './constant';

export default class TodoItem extends Component {
  handleSubmit = () => {
    const val = this.state.editText.trim();
    if (val) {
      this.props.onSave(this.props.todo.id, val);
      this.setState({editText: val});
    } else {
      this.props.onDestroy(this.props.todo.id);
    }
  }

  handleEdit = () => {
    this.props.onEdit(this.props.todo.id);
    this.setState({editText: this.props.todo.title});
  }

  handleKeyDown = (event) =>{
    if (event.which === ESCAPE_KEY) {
      this.setState({editText: this.props.todo.title});
      this.props.onCancel(event);
    } else if (event.which === ENTER_KEY) {
      this.handleSubmit(event);
    }
  }

  handleChange = (event) => {
    if (this.props.editing) {
      this.setState({editText: event.target.value});
    }
  }
  render() {
    return (
      <li className={classNames({
        completed: this.props.todo.completed,
        editing: this.props.editing
      })}>
        <div className="view">
          <input
            className="toggle"
            type="checkbox"
            checked={this.props.todo.completed}
            onChange={() => this.props.onToggle(this.props.todo.id)}
          />
          <label onDblClick={this.handleEdit}>
            {this.props.todo.title}
          </label>
          <button className="destroy" onClick={() => this.props.onDestroy(this.props.todo.id)} />
        </div>
        <input
          ref="editField"
          className="edit"
          value={this.state.editText}
          onBlur={this.handleSubmit}
          onKeyUp={this.handleChange}
          onKeyDown={this.handleKeyDown}
        />
      </li>
    );
  }
}

