// CAUTION subscriber 中不能同一个函数多次注册
import { ErrorDuplicateSubscriber, ErrorWrongSubscriber } from './errors'

export default function createSubscribers() {
  const subscribers = []

  return {
    insert(fn) {
      if (typeof fn !== 'function') { throw new ErrorWrongSubscriber(fn) }
      if (subscribers.includes(fn)) { throw new ErrorDuplicateSubscriber(fn) }

      subscribers.push(fn)
      return function unsubscribe() {
        subscribers.splice(subscribers.findIndex(subscriber => subscriber !== fn), 1)
      }
    },
    forEach: handler => subscribers.forEach(handler),
    notify(...args) {
      subscribers.forEach(fn => fn(...args))
    },
  }
}
