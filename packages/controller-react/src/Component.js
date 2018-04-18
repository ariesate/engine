export default class Component {
  constructor() {
    this.state = {}
  }
  setState(nextStateFn) {
    this.state = { ...this.state, ...nextStateFn(this.state) }
    this.$$reportChange$$()
  }
}
