import cloneDeep from 'lodash/cloneDeep'
import { each } from './util'

export default function applyLazyInitialize(createStateTree) {
  return function (mockStateTree) {
    let realStateTree = null

    const output = {
      unwrap() {
        realStateTree = createStateTree(cloneDeep(mockStateTree.get()))
      },
    }

    each(mockStateTree, (mockFn, fnName) => {
      Object.defineProperty(output, fnName, {
        get() {
          return realStateTree === null ? mockFn : realStateTree[fnName]
        },
        enumerable: true,
      })
    })

    return output
  }
}
