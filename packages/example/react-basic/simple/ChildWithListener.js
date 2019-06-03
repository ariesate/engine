import React from 'areact'

export default class ChildWithListener extends React.Component {
  render() {
    return (
      <div>
        <h2>Child Component(get props from parent)</h2>
        <div>
          <button onClick={this.props.onAdd}>+</button>
          <span>{this.props.value}</span>
          <button onClick={this.props.onSubtract}>-</button>
        </div>
      </div>
    )
  }
}