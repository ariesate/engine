import createBackgroundJobContainer from '../createBackgroundJobContainer'
import createStateTree from '../createStateTree'
import applyStateTreeSubscriber from '../applyStateTreeSubscriber'
import * as stateTreeUtilDef from '../background/utility/stateTree'
import * as mapBackgroundToStateJobDef from '../background/job/mapBackgroundToState'
import { partial } from '../util'

describe('basic', () => {
  let stateTree
  let backgroundJob

  beforeEach(() => {
    stateTree = applyStateTreeSubscriber(createStateTree)()
    const utilInstances = {}
    backgroundJob = createBackgroundJobContainer(
      { mapBackgroundToState: mapBackgroundToStateJobDef },
      { stateTree: stateTreeUtilDef },
      utilInstances,
      stateTree,
    )
    utilInstances.stateTree = stateTreeUtilDef.initialize(stateTree, undefined, utilInstances, partial(backgroundJob.notify, 'stateTree'))
  })

  test('test mapBackgroundToState', () => {
    stateTree.register('jim', () => ({ a: 1, b: 2 }), 'Test', () => 'Jim')
    const { stateId } = stateTree.register('biggerJim', () => ({ a: 1, b: 2 }), 'Test', { getStatePath: () => 'biggerJim' })
    backgroundJob.register(stateId, {
      mapBackgroundToState: [({ stateTree: innerStateTree }) => {
        return {
          a: innerStateTree.get('jim.a') + 1,
          b: innerStateTree.get('jim.b') + 2,
        }
      }],
    })

    expect(stateTree.get('biggerJim')).toEqual({ a: 1, b: 2 })
    backgroundJob.start()
    // 开始以后，立即计算一次
    expect(stateTree.get('biggerJim')).toEqual({ a: 2, b: 4 })

    // 改变之后，触发变化
    stateTree.merge('jim.a', 3)
    expect(stateTree.get('biggerJim')).toEqual({ a: 4, b: 4 })
  })
})

