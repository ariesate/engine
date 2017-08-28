import { StatePath } from '../../common'

function createInterpolate(str, keys) {
  /* eslint-disable no-new-func */
  return new Function(`{${keys.join(',')}}`, `return \`${str}\``)
  /* eslint-enable no-new-func */
}

export function initialize(utilInstances, _, appearance) {
  const idToInterpolate = {}

  function register(id, { children, interpolate, getStatePath }) {
    const fn = (typeof interpolate === 'function') ?
      interpolate :
      createInterpolate(children, Object.keys(utilInstances))

    idToInterpolate[id] = { fn, getStatePath }
  }

  // 跑一遍得到结果
  function run(id) {
    return idToInterpolate[id].fn({
      ...utilInstances,
      statePath: new StatePath(idToInterpolate[id].getStatePath()),
    })
  }

// 处理结果
  function handle(id, result) {
    appearance.replaceChildrenById(id, result)
  }

  return {
    register,
    run,
    handle,
  }
}

export function check({ interpolation, interpolate }) {
  return interpolation === true || interpolate !== undefined
}
