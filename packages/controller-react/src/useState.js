import { invariant } from './util'

export default function useState(initialState) {
  invariant(!window.React.__internal__.useStateHookCurrentComponent, 'useState should only be used in Component')

  const currentCnode = window.React.__internal__.useStateHookCurrentComponent
  let currentState = initialState
  if (!currentCnode.states) {
    currentCnode.states = []
  }

  return [currentState, () => window.React.__internal__.reportChange(currentCnode)]

}
