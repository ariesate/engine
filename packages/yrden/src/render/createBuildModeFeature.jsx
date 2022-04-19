import { propTypes, atom, useViewEffect } from 'axii'
import { SCHEMA_NODE_ID_STATE_NAME, SCHEMA_NODE_INDEX_STATE_NAME } from './render'



export function createBuildModeFeature({ listen, collect, inspect, useViewEffect: featureUseViewEffect }) {

  function BuildModeFeature(fragments) {
    listen.forEach(({ listeners, matcher : listenerMatcher }) => {
      Object.entries(listeners).forEach(([listenerName, listener]) => {
        fragments.global.elements(listenerMatcher)[listenerName](listener)
      })
    })

    collect.forEach(({ collector, matcher: collectorMatcher}) => {
      // 注意这里用的 modify 来实现的，modify 返回 undefined 就是 getter
      fragments.global.elements(collectorMatcher).modify(collector)
    })

    inspect && fragments.global.inspect(inspect)

    featureUseViewEffect && fragments.root.prepare((...argv) => {
      useViewEffect(() => featureUseViewEffect(...argv))
    })
  }

  BuildModeFeature.propTypes = {
    [SCHEMA_NODE_ID_STATE_NAME]: propTypes.string.default(() => atom('')),
    [SCHEMA_NODE_INDEX_STATE_NAME]: propTypes.string.default(() => atom())
  }

  return BuildModeFeature
}

