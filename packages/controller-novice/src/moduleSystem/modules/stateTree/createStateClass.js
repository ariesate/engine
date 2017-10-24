import { extendObservable } from 'mobx'

export default function createStateClass(type, getInitialState) {
  const StateNodeClass = function (currentState, owner) {
    // TODO add reset function?
    extendObservable(this, { ...getInitialState(), ...currentState })
    this.getOwner = () => owner
  }
  StateNodeClass.displayName = type.displayName
  return StateNodeClass
}
