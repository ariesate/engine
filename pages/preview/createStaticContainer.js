import React from 'react'

export default function createStaticContainer(Component) {
  return class StaticComponent extends React.Component {
    shouldComponentUpdate() {
      return false
    }
    render() {
      return <Component {...this.props} />
    }
  }
}
