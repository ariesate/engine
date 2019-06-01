import React from 'areact'

export default class ChildWithSetState extends React.Component {
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