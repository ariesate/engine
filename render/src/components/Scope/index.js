/* eslint-disable no-nested-ternary*/
import React from 'react'
import PropTypes from 'prop-types'
import { ErrorScopeChildren } from '../../errors'

// 过滤掉 undefined 内容
function compact(arr) {
  return arr.filter(a => a !== undefined && a !== '')
}

// 让数组内容组合成一个 string 返回， e.g. root.button.value
function joinPath(arr) {
  return compact(arr).join('.')
}

function resolve(obj, fn, defaultValue) {
  return (typeof obj === 'object' && typeof obj[fn] === 'function') ? obj[fn]() : defaultValue
}

export default class Scope extends React.Component {
  static propTypes = {
    // 当前用 scope 包装的子组件是在当前组件 state 的哪个数据上
    relativeChildStatePath: PropTypes.string.isRequired,
  }
  static contextTypes = {
    // 上层所有 scope 的 <Scope /> 获取的
    getScopes: PropTypes.func,
    // 从上层的 <Store /> 或者 <Scope /> 获取的
    getStatePath: PropTypes.func,
  }

  static childContextTypes = {
    getScopes: PropTypes.func,
    getStatePath: PropTypes.func,
  }

  getChildContext() {
    return {
      getScopes: () => {
        const scopes = resolve(this.context, 'getScopes', [])
        const childStatePath = joinPath([resolve(this.context, 'getStatePath'), this.props.relativeChildStatePath])
        return scopes.concat({
          statePath: childStatePath,
          isRoot: this.props.isRoot,
        })
      },
      getStatePath: () => {
        return joinPath([resolve(this.context, 'getStatePath'), this.props.relativeChildStatePath])
      },
    }
  }

  render() {
    if (this.props.children === undefined) {
      throw new ErrorScopeChildren(0)
    } else if (Array.isArray(this.props.children) && this.props.children.length > 1) {
      throw new ErrorScopeChildren(this.props.children.length)
    }

    // 后面的 span 兼容的是文字模式, 不是指的数组, Scope 下不允许传数组
    return React.isValidElement(this.props.children) ? this.props.children : <span>{this.props.children}</span>
  }
}
