/**
 * Form 这个 background 只是提供对表单组件数据的快速集合操作。和 validation 不同，它内部没有其他状态。
 * 为了不和 validation 的状态冲突，它不提供 error 等状态的设置。
 */

import { each, partial } from '../../util'
import createTree from '../../createTree'
import Interface from './form.interface.js'

export function initialize(stateTree) {
  // 记录所有受控的表单组件
  const formControls = createTree()

  function joinPath(path) {
    return path.filter(p => p !== undefined && p.trim() !== '').join('.')
  }

  function oneOrAll(fn, statePath, all = false) {
    if (all === true) {
      each(formControls.getBranches(statePath), relativeStatePath => fn(joinPath([statePath, relativeStatePath])))
    } else {
      fn(statePath)
    }
  }

  function register(statePath) {
    formControls.forceSet(statePath, true)
    return () => { formControls.remove(statePath) }
  }

  const setOneOrAllFormControlField = (field, value) => partial(oneOrAll, (statPath) => {
    formControls.get(statPath)(field, value)
  })

  const disable = setOneOrAllFormControlField('disabled', true)
  const enable = setOneOrAllFormControlField('disabled', false)
  const validating = setOneOrAllFormControlField('status', 'validating')

  const reset = partial(oneOrAll, (statPath) => {
    stateTree.reset(statPath)
  })

  return {
    register,
    disable,
    enable,
    validating,
    reset,
  }
}

export function check(config, Component) {
  return Component.implement && (Component.implement.includes(Interface.form) || Component.implements.includes(Interface.item))
}

export { Interface }
