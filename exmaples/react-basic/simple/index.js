import { createElement, render, Component } from 'areact'

class Child extends Component {
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

class ChildStyle extends Component {
  change = () => {
    this.setState(() => ({
      bg: !this.state.bg,
    }))
  }
  render() {
    return (
      <div>
        <h2>Change Self Style</h2>
        <div style={{ width: 100, height: 100, border: '1px #000 solid', background: this.state.bg ? '#000' : 'transparent' }}>childStyle</div>
        <button onClick={this.change}>change</button>
      </div>

    )
  }
}

class App extends Component {
  constructor() {
    super()
    this.state = {
      textValue: '',
      value: 'initialValue',
      childValue: 1,
    }
  }
  onKeyUp = (e) => {
    this.setState(() => ({
      textValue: e.target.value,
    }))
  }
  onChildAdd = () => {
    this.setState(({ childValue }) => ({
      childValue: ++childValue,
    }))
  }
  onChildSubtract = () => {
    this.setState(({ childValue }) => ({
      childValue: --childValue,
    }))
  }
  render() {
    return (
      <div>
        <h1>App</h1>
        <div>
          <span>value:{this.state.textValue}</span>
        </div>
        <input onKeyUp={this.onKeyUp} value={this.state.value} />
        <Child value={this.state.childValue} onAdd={this.onChildAdd} onSubtract={this.onChildSubtract} />
        <ChildStyle />
      </div>
    )
  }
}

const controller = render((
  <div>
    <App />
  </div>
), document.getElementById('root'))

window.controller = controller
