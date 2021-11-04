import { atom } from './index'
import { invariant } from './util';

/**
 * 1. 当用户获取某个值时，才生成。以及对变化的监听函数。
 * 2. 如果当前 ref 已有，立即设置一次这个值，并开始监听。
 * 3. 当 ref 变化时，清理上一次的监听，并重新设置值和监听。
 * 4. TODO 在批量更新时，是否会触发 resize 之类的行为？
 */


const ReactiveValues = {
  clientWidth() {

    const value = atom(0)
    const observer = new ResizeObserver(([entry]) => {
       value.value = entry.target.clientWidth
    })

    function observe(target) {
      if (!target) return
      observer.observe(target)
      return () => {
        observer.unobserve(target)
      }
    }

    return {value, observe}
  },
  scrollWidth() {

    const value = atom(0)
    const observer = new ResizeObserver(([entry]) => {
      value.value = entry.target.scrollWidth
    })

    function observe(target) {
      if (!target) return
      observer.observe(target)
      return () => {
        observer.unobserve(target)
      }
    }

    return {value, observe}
  }
}


function createCreateRef(reactiveValues) {

  return function createRef() {

    const target = {
      current: null
    }

    const observeFns = []
    const cancelFns = []

    return new Proxy(target, {
      get(target, key, receiver) {
        if (!target[key] && typeof key === 'string') {
          invariant(reactiveValues[key] !== undefined, `unknown value: ${key} `)
          const { value, observe } = reactiveValues[key]()
          Reflect.set(target, key, value)
          observeFns.push(observe)
          // 如果已有，立即执行
          const current = Reflect.get(target, 'current')
          if (current) cancelFns.push(observe(current))
        }

        return Reflect.get(target, key, receiver)
      },
      set(target, key, value, receiver) {

        invariant(key === 'current', `you are setting ${key}`)

        Reflect.set(target, 'current', value, receiver)

        cancelFns.forEach(cancel => cancel())
        // TODO 需要 batch 一下？？？否则会触发多次重新计算
        observeFns.forEach(observe => observe(Reflect.get(target, 'current')))
        return true
      }
    })
  }

}




export default createCreateRef(ReactiveValues)
