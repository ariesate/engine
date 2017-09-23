export default class OrderedMap {
  constructor(data = []) {
    if (Array.isArray(data)) {
      this.data = data.map(d => d.value)
      this.order = data.map(d => d.key)
    } else {
      this.data = { ...data }
      this.order = Object.keys(data)
      // TODO 当对象的 key 是数字是，默认排序不是按照定义顺序排的，要提示用户
    }
  }
  map(handler) {
    return this.order.map(key => handler(this.data[key], key))
  }
  push(key, item) {
    if (this.data[key] !== undefined) throw new Error(`${key} already exist`)
    this.order.push(key)
    this.data[key] = item
  }
  pop() {
    const key = this.order.pop()
    const item = this.data[key]
    delete this.data[key]
    return item
  }
  shift() {
    const key = this.order.shift()
    const item = this.data[key]
    delete this.data[key]
    return item
  }
  unshift(key, item) {
    if (this.data[key] !== undefined) throw new Error(`${key} already exist`)
    this.order.unshift(key)
    this.data[key] = item
  }
  set(key, item) {
    if (this.data[key] === undefined) throw new Error(`${key} do not exist`)
    this.data[key] = item
  }
  forEach(handler) {
    return this.order.forEach(key => handler(this.data[key], key))
  }
}
