export default class Component {
  constructor() {
    this.state = {}
  }
  setState(nextStateFn) {
    this.$$nextStateFns.push(nextStateFn)
    this.$$reportChange$$()
  }
}
