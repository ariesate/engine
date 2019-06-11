import { invariant } from './util'
import { getCurrentWorkingCnode } from './createReactController'

export default function useState(initialState) {
  const [currentCnode, index, setIndex] = getCurrentWorkingCnode(0)
  invariant(currentCnode !== null, 'useState should only be used in Component')

  if (!currentCnode.states) {
    currentCnode.states = []
  }

  const currentState = currentCnode.states.length <= index ? initialState : currentCnode.states[index]

  const setCurrentState = (nextValue) => {
    currentCnode.states[index] = nextValue
    currentCnode.instance.$$reportChange$$()
  }

  // 增加 index
  setIndex(index+1)

  return [currentState, setCurrentState]
}
