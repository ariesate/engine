import { mapValues, compose, reduce } from '../util'

function combineModuleApis(layeredInstances, apis) {
  return mapValues(apis, (defaultApi, name) => {
    const fns = layeredInstances.reduce((allFns, mods) => {
      return reduce(mods, (oneLayerFns, mod) => {
        return mod[name] === undefined ? oneLayerFns : oneLayerFns.concat(mod[name])
      }, []).concat(allFns)
    }, [])

    return compose(fns)(defaultApi)
  })
}

export default function createMultiLayeredModuleSystem(apis, layeredMods) {

  const system = {}

  const layeredInstances = layeredMods.map((oneLayerMods) => {
    return mapValues(oneLayerMods, (mod) => {
      const argv = (mod.argv || []).concat(system)
      return mod.initialize(...argv)
    })
  })

  Object.assign(system, combineModuleApis(layeredInstances, apis))

  system.instances = layeredInstances.reduce(Object.assign, {})
  return system
}
