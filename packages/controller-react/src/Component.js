export default class Component {
  constructor() {
    this.state = {}
  }
  setState(nextStateFn) {
    this.nextStateFn = nextStateFn
    this.$$reportChange$$()
  }
}
