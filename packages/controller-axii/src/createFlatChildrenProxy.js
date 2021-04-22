import { isAtom } from './reactive';

/**
 * 对 children 的使用一定在 vnodeComputed 或者其他 computed 里面。
 *
 * React children 的遍历规则：
 * 1. 永远不对 Fragment 展开
 * 2. 默认不对 array 进行展开
 * 3. 如果使用 React.Children.toArray 的话，会对children 中的数组递归展开。
 */

function getChildrenFromArrayType(input) {
  // CAUTION 如果是函数，直接执行就是，目前看起来也没有必要做缓存。去读 children 中的内容的情况并不常见。
  const vnode = (typeof input  === 'function') ? input() : input

  if (isAtom(vnode)) {
    return Array.isArray(vnode.value) ? vnode.value : undefined
  }

  // 因为 vnodeComputed 的节点阻断了 normalizeChildren 的过程，我们又不愿意在 vnodeComputed 里面去处理，
  // 而是希望保持数组原貌，所以这里来做判断兼容。
  if (Array.isArray(vnode)) return vnode

  return vnode.type === Array ? vnode.children : undefined
}

function deepGet(base, pointer) {
  let parent = base
  pointer.forEach(i => {
    // 可能是 ref，也可能是普通的
    const child = parent[i]
    parent = getChildrenFromArrayType(child)
  })
  return parent
}

function findFirstValueAndPointer(vnode) {
  // 先判断当前节点是否符合要求
  const children = getChildrenFromArrayType(vnode)
  // 如果娶不到 children，说明当前节点符合要求。
  if (!children) return [vnode, []]
  // 如果当前节点的children 为空，说明全都不符合要求。
  if(children.length === 0) return [undefined, undefined]

  // 从头开始找 children 中符合条件的。
  return findNextValueAndPointer(children, [-1])
}

function findNextValueAndPointer(children, pointer) {
  if (pointer.length === 0) return [undefined, undefined]

  const parentPointer = pointer.slice(0, pointer.length - 1)
  const lastIndex = pointer[pointer.length -1]
  const parent = deepGet(children, parentPointer)

  const nextLastIndex = lastIndex + 1
  const nextValue = parent[nextLastIndex]
  // 没有的话直接返回上一层
  if (!nextValue) return findNextValueAndPointer(children, parentPointer)

  // 有当前这一个
  // 当前这个这个节点是否符合标准，或者当前这个节点下第一个符合标准的节点
  const [firstChildValue, firstChildPointer] = findFirstValueAndPointer(nextValue)
  // 如果 firstChildPointer === [] 说明就是当前这个符合要求。
  if (firstChildPointer) return [firstChildValue, parentPointer.concat(nextLastIndex, firstChildPointer)]

  // 如果当前节点不符合要求，那么久再往右好了。
  return findNextValueAndPointer(children, parentPointer.concat(nextLastIndex))

}

function createIterator(children) {
  let pointer = [-1]
  let count = 0

  return {
    next() {
      let value
      let done
      // 获取下一个，并且改变游标。
      const [nextValue, nextPointer] = findNextValueAndPointer(children, pointer)
      if (nextPointer) {
        value = nextValue
        done = false
        pointer = nextPointer
        count++
      } else {
        value = count
        done = true
      }
      return {value, done}
    },
  }
}

function createEachLike(callHandler, createInitialResult) {
  return function(handler, ...argv) {
    const iterator = createIterator(this)
    let item = iterator.next()
    let result = createInitialResult ? createInitialResult() : undefined
    let count = 0
    while(!item.done) {
      result = callHandler(result, handler, item.value, count, ...argv)
      item = iterator.next()
      count++
    }

    return result
  }
}

function createSomeLike(callHandler, initialResult) {
  return function(handler, ...argv) {
    const iterator = createIterator(this)
    let item = iterator.next()
    let count = 0
    let finalResult = initialResult
    while(!item.done) {
      const { result, shouldStop } = callHandler(handler, item.value, count, ...argv)
      finalResult = result
      if (shouldStop) break

      item = iterator.next()
      count++
    }

    return finalResult
  }
}

const mutableInstrumentations = {
  map: createEachLike(function(lastResult, handler, value, count) {
    lastResult.push(handler(value, count))
    return lastResult
  }, () => []),
  forEach: createEachLike(function(lastResult, handler, value, count) {
    handler(value, count)
  }),
  reduce: createEachLike(function(lastResult, handler, value, count, initialResult) {
    const last = count === 0 ? initialResult : lastResult
    return handler(last, value, count)
  }),
  some: createSomeLike(function(handler, value, count) {
    const result = handler(value, count)
    return { result, shouldStop: result}
  }, false),
  every: createSomeLike(function(handler, value, count) {
    const result = handler(value, count)
    return { result, shouldStop: !result}
  }, true),
  [Symbol.iterator]: function() {
    return createIterator(this)
  }
}

export default function createFlatChildrenProxy(children) {
  // 定义的 iterator 会 flatten children ，也会去展开 vnodeComputed。
  // 如果完全没动过，那么就要给个标记。外面会将 proxy 替换会原本的 children。
  let touched = false
  return new Proxy(children, {
    get: function(target, key) {
      if (key === 'touched') return touched

      // 除此之外获取任何值都是 touched
      touched = true

      if (key === 'length') {
        let length = 0
        const iterator = createIterator(children)
        let item = iterator.next()
        while(!item.done) {
          ++length
          item = iterator.next()
        }
        return length
      }

      if (mutableInstrumentations[key]) {
        return mutableInstrumentations[key].bind(children)
      }
      // CAUTION 没有过滤 0 开头的情况
      if (/^[0-9]+$/.test(key)) {
        const iterator = createIterator(children)
        let count = -1
        const targetCount = parseInt(key)
        while(targetCount > count) {
          ++count
          const { value, done } = iterator.next()
          if (done) return undefined
          if (targetCount === count) return value
        }
        // 不可能达到这里
      }
    },
    set: function(target, key, value) {
      if (key === 'touched') {
        touched = value
        return true
      }

      return false
    }
  })

}
