import * as React from 'areact'
import ChildWithListener from './ChildWithListener'
import ChildWithSetState from './ChildWithSetState'
import ChildWithShouldComponentUpdate from './ChildWithShouldComponentUpdate'

export default class App extends React.Component {
  constructor() {
    super()
    this.state = {
      childValue: 1,
    }
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
        <ChildWithListener  value={this.state.childValue} onAdd={this.onChildAdd} onSubtract={this.onChildSubtract} />
        <ChildWithSetState />
        <ChildWithShouldComponentUpdate />
      </div>
    )
  }
}
