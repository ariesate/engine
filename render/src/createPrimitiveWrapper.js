import React from 'react'
import PropTypes from 'prop-types'
import { createUniqueIdGenerator } from './util'

const generatePrimitiveId = createUniqueIdGenerator('c')

export default function createPrimitiveWrapper(Tag, display) {
  const wrappedRender = ({ children, props }) => (<Tag {...props}>{children}</Tag>)

  class Primitive extends React.Component {
    static displayName = Tag
    // 此声明用来获取 context 当中的 background 和 appearance
    static contextTypes = {
      getStatePath: PropTypes.func,
      background: PropTypes.object.isRequired,
      appearance: PropTypes.object.isRequired,
    }
    constructor(config, { background, appearance, getStatePath }) {
      super()
      this.state = {
        version: 0,
      }
      this.id = generatePrimitiveId()

      const { cancel: unsubscribeAppearance, hijack } = appearance.register(this.id, config, this.subscribe)
      this.cancelAppearance = unsubscribeAppearance
      this.hijack = hijack

      const { cancel } = background.register(this.id, {
        ...config,
        getStatePath,
      }, {})

      this.cancelBackground = cancel
    }
    componentWillUnmount() {
      this.cancelAppearance()
      this.cancelBackground()
    }
    subscribe = () => {
      this.setState({ version: this.state.version++ })
    }
    render() {
      return this.hijack(wrappedRender, display, this.props)({ ...this.props })
    }
  }

  return Primitive
}
