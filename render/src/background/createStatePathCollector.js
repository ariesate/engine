/**
 * 通用的 statePath 类型的收集器。例如 stateTree.get, validation.isValid 。收集的都是 statePath。
 */

import { concat } from '../util'

export default function createStatePathCollector() {
  let collecting = false
  let dependencies = {}
  let onceWithDep = []

  // 下面这三个函数，是 bg 必须提供的
  // 标记开始收集
  function collect() {
    if (collecting) throw new Error('already collecting')
    collecting = true
  }

  // 获取 deps
  function extract() {
    collecting = false
    const dependenciesToExtract = { ...dependencies }
    dependencies = {}
    return dependenciesToExtract
  }

  // 跑一次callback,同时保存在 oneWithDep
  function once(dep, callback) {
    function removeOnce() {
      onceWithDep = onceWithDep.filter(({ key }) => key !== callback)
    }

    onceWithDep.push({ dep, callback: concat([callback, removeOnce]), key: callback })
    return removeOnce
  }

  // 跑所有的 callback
  function invoke(check) {
    onceWithDep.forEach(({ dep, callback }) => {
      if (check(dep)) callback()
    })
  }

  function insert(statePath, detail = true) {
    if (collecting) {
      dependencies[statePath] = detail
    }
  }

  function update(statePath, updater) {
    if (collecting) {
      dependencies[statePath] = updater(dependencies[statePath])
    }
  }

  return {
    onceWithDep,
    collect,
    extract,
    once,
    invoke,
    insert,
    update,
  }
}
