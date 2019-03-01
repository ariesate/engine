import { createElement, Component } from 'areact'

export default class ChildWithShouldComponentUpdate extends Component {
  constructor() {
    super()
    this.state = {
      v1 : 0,
      v2 : 1,
    }
  }
  onAdd = () => {
    this.setState(() => ({
      v1: this.state.v1 + 1
    }))
  }
  onSubtract = () => {
    this.setState(() => ({
      v1: this.state.v1 - 1
    }))
  }
  onAdd2 = () => {
    this.setState(() => ({
      v2: this.state.v2 + 1
    }))
  }
  onSubtract2 = () => {
    this.setState(() => ({
      v2: this.state.v2 - 1
    }))
  }
  shouldComponentUpdate(nextProps, nextState) {
    console.log(nextState, this.state)
    return nextState.v2 !== this.state.v2
  }
  render() {
    return (
      <div>
        <h2>With ShouldComponentUpdate</h2>
        <div>
          <h3>will not rerender when change</h3>
          <button onClick={this.onAdd}>+</button>
          <span>{this.state.v1}</span>
          <button onClick={this.onSubtract}>-</button>
        </div>
        <div>
          <h3>will rerender when change</h3>
          <button onClick={this.onAdd2}>+</button>
          <span>{this.state.v2}</span>
          <button onClick={this.onSubtract2}>-</button>
        </div>
      </div>
    )
  }
}