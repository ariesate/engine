import { isAtom } from '../reactive';
import propTypes from "../propTypes";
import {isFunction} from '../util'
import {isVnodeComputed} from "../vnodeComputed";

function isComputed(vnode) {
  return isFunction(vnode) || isVnodeComputed(vnode)
}


function getByPath(base, path) {
  if (!base) return undefined
  let parent = base
  let key
  while( key = path.shift()) {
    if (!parent[key]) return undefined
    parent = parent[key]
  }
  return parent
}


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
  // CAUTION 没有的话直接返回上一层。注意这里的 === undefined 很重要，因为 null/0/false 也算，不能用 !nextValue。
  if (nextValue === undefined) return findNextValueAndPointer(children, parentPointer)
  // if (!parent.hasOwnProperty(nextValue)) return findNextValueAndPointer(children, parentPointer)

  // 有当前这一个
  // 当前这个这个节点是否符合标准，或者当前这个节点下第一个符合标准的节点
  const [firstChildValue, firstChildPointer] = findFirstValueAndPointer(nextValue)
  // 如果 firstChildPointer === [] 说明就是当前这个符合要求。
  if (firstChildPointer) return [firstChildValue, parentPointer.concat(nextLastIndex, firstChildPointer)]

  // 如果当前节点不符合要求，那么久再往右好了。
  return findNextValueAndPointer(children, parentPointer.concat(nextLastIndex))

}

function createIterator(children) {

  const base = (isFunction(children)) ? children() : children
  let pointer = [-1]
  let count = 0

  return {
    next() {
      let value
      let done
      // 获取下一个，并且改变游标。
      const [nextValue, nextPointer] = findNextValueAndPointer(base, pointer)
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



/**
 * 一定是 arrayOf(element) | [...element] 才会用这个。
 * 有可能 children 直接就是 vnodeComputed，也可能是静态数组。
 */
export function createFlatChildrenProxy(children, path = [], childrenPropType = propTypes.arrayOf(propTypes.element())) {
  // 这里的 shape 可能是 arrayOf(element) 也可能是 shapeOf([element])
  const elementShape = childrenPropType.argv[0]

  const mutableInstruments = {
    map: createEachLike(function(lastResult, handler, value, count) {
      const elementPropType = Array.isArray(elementShape) ? elementShape[count] : elementShape
      lastResult.push(handler(createElementChildProxy(value, [], elementPropType), count))
      return lastResult
    }, () => []),
    forEach: createEachLike(function(lastResult, handler, value, count) {
      const elementPropType = Array.isArray(elementShape) ? elementShape[count] : elementShape
      handler(createElementChildProxy(value, [], elementPropType), count)
    }),
    reduce: createEachLike(function(lastResult, handler, value, count, initialResult) {
      const last = count === 0 ? initialResult : lastResult
      const elementPropType = Array.isArray(elementShape) ? elementShape[count] : elementShape
      return handler(last, createElementChildProxy(value, [], elementPropType), count)
    }),
    some: createSomeLike(function(handler, value, count) {
      const elementPropType = Array.isArray(elementShape) ? elementShape[count] : elementShape
      const result = handler(createElementChildProxy(value, [], elementPropType), count)
      return { result, shouldStop: result}
    }, false),
    every: createSomeLike(function(handler, value, count) {
      const elementPropType = Array.isArray(elementShape) ? elementShape[count] : elementShape
      const result = handler(createElementChildProxy(value, [], elementPropType), count)
      return { result, shouldStop: !result}
    }, true),
    [Symbol.iterator]: function() {
      return createIterator(this)
    }
  }
  // 定义的 iterator 会 flatten children ，也会去展开 vnodeComputed。
  // 如果完全没动过，那么就要给个标记。外面会将 proxy 替换会原本的 children。
  const toProxy = isFunction(children) ?
    function getComputedFlatChildren() { return getByPath(children(), path) } :
    children
  return new Proxy(toProxy || [], {
    get: function(target, key) {
      if (key === 'raw') return children
      if (key === 'isChildren') return true

      // 除此之外获取任何值都是 touched
      if (key === 'length') {
        let length = 0
        const iterator = createIterator(toProxy)
        let item = iterator.next()
        while(!item.done) {
          ++length
          item = iterator.next()
        }
        return length
      }

      if (mutableInstruments[key]) {
        return mutableInstruments[key].bind(children)
      }
      // CAUTION 没有过滤 0 开头的情况
      if (typeof key === 'string' && /^[0-9]+$/.test(key)) {
        const iterator = createIterator(toProxy)
        let count = -1
        const targetCount = parseInt(key, 10)
        while(targetCount > count) {
          ++count
          const { value, done } = iterator.next()
          const elementPropType = Array.isArray(elementShape) ? elementShape[count] : elementShape
          if (done) return createElementChildProxy(undefined, [], elementPropType)
          if (targetCount === count) return createElementChildProxy(value, [], elementPropType)
        }
        // 不可能达到这里
      }
    }
  })

}

/**
 * 用户可能传进来两种情况：
 * 1. function，里面返回一个 element
 * 2. 静态 element|null。但是有children。
 *
 * 我们的组件可能会读 children.children。
 * 用户是需要自己在代码判断有没有 children 再决定怎么读的。例如 children?.children
 * 我们 proxy 的目的是为了让用户"传进来的"children，不管是静态的还是动态的，在 render
 * 出来之后有个标记，防止被篡改。
 * 如果传进来的 children 不存在，我们就直接返回出来就行了，因为无法篡改。
 *
 * 这里的难点在于：如果是静态，那么我们的工作就只有为节点打上标记，很简单。
 * 但如果是动态，那么我们还要做到：
 * 1. 用户对 children 是不是动态的无感知。vnodeComputed 下继续读到的 children 也自动变成 vnodeComputed。
 * 2. 对 vnodeComputed 打上标记。
 */
export function createElementChildProxy(child, path, elementPropType) {
  // 如果是静态的，null||undefined 节点，不需要标记，直接返回，因为读了也没意义。
  if(!child) return child
  // 如果是静态字符串|数字，那么也直接返回，不需要 Proxy。
  if (!(typeof child === 'object' || typeof child === 'function')) return child

  const isChildComputed = isFunction(child)
  const toProxy = isChildComputed?
    function getComputedElement(){ return getByPath(child(), path) }:
    child


  return new Proxy(toProxy || {}, {
    get(target, key) {
      if (key === 'raw') return child
      if(key === 'isChildren') return true
      // 还可以继续读 children
      if(key === 'children') {
        const childrenPropType = elementPropType?.argv[0]?.children || propTypes.arrayOf(propTypes.element())
        if (isChildComputed) {
          return createChildrenProxy(child, childrenPropType, path.concat('children'))
        }
        // 没有 children。是 null|undefined
        if (!child.children) return child.children
        // 有 children
        return createChildrenProxy(child.children, childrenPropType)
      }
      // 如果是读 children 上的字段，可以直接解开，因为这个行为是在用户读的环境下，
      //  用户是一定得包装在一个 vnodeComputed 里面的。
      return isChildComputed ?
        getByPath(child(), path.concat(key)):
        child[key]
    }
  })
}



// childrenProp 一定是个静态数组，所以这里要智能判断一下
export function smartCreateChildrenProxy(childrenProp, childrenPropType = propTypes.arrayOf(propTypes.element())) {
   const shouldUnwrap = childrenPropType.is(propTypes.element) ||
     childrenPropType.is(propTypes.shapeOf) && !Array.isArray(childrenPropType.argv[0])

  return createChildrenProxy(shouldUnwrap ? childrenProp[0] : childrenProp, childrenPropType)
}

/**
 * CAUTION 这里不能用 createElement 上的特殊标记实现，因为一个组件直接 return 一个外部创建好的 vnode，应该也算自己的。这标记不到
 *  也不能用 seenChildren 实现，因为可能出现很复杂的情况，seenChildren 相当于只要传递过就弄脏了。
 *  最符合语义就是传的时候创建 proxy。
 */
export function createChildrenProxy(children, childrenPropType = propTypes.arrayOf(propTypes.element()), path = []) {
  // element/arrayOf(array)/[...element] 是可以直接拿来渲染的
  // 1. 就直接是 element
  if(childrenPropType.is(propTypes.element)) {
    // TODO 如果是 vnodeComputed, 应该要保持住引用啊。
    return createElementChildProxy(children, path, childrenPropType)
  }


  // 2. 是 arrayOf(element)|[element]，那么就需要考虑 flat 其中的 vnodeComputed 了
  if (
    (childrenPropType.is(propTypes.arrayOf) && childrenPropType.argv[0].is(propTypes.element)) ||
    (childrenPropType.is(propTypes.shapeOf) && Array.isArray(childrenPropType.argv[0]))
  ) {
    // 如果是通过 <Component>{xxx}</Component> 传进来的，那么 children 一定是个 []。
    // 只有通过 { body: () => { return [] } } 这种方式传递的，才会直接拿到一个 vnodeComputed。
    // 我们把这中数据格式统一一下，都变成 [ vnodeComputed，] 的形式
    return createFlatChildrenProxy(children, path, childrenPropType)
  }

  // 3. 是 arrayOf(!element) 或者 shapeOf(!element) 的结构
  //  CAUTION 这里要注意的是如果用户声明的 propType 为 shapeOf，并且传进来的 children 是个数组，那么我们自动解开第一个
  const shouldBeObject = childrenPropType.is(propTypes.shapeOf) && !Array.isArray(childrenPropType.argv[0])
  const childrenToProxy = isFunction(children) ?
    function getComputedShape() { return getByPath(children(), path)} :
    (children ?
      children :
      (shouldBeObject ? {} : [])
    )

  return new Proxy(childrenToProxy, {
    get(target, key) {
      if (key === 'raw') return target
      // 这个结构如果是 []，也是可以被直接 render 的，所以也要标记
      if (key === 'isChildren') return true

      // 这是一个结构，可以是 arrayOf/shapeOf 之一开始
      // 如果 child 是个嵌套的普通对象结构，不是 propTypes，那么继续构造成 shapeOf。

      const childPropType = childrenPropType.argv[0][key].is ? childrenPropType.argv[0][key] : propTypes.shapeOf(childrenPropType.argv[0][key])
      return isFunction(childrenToProxy) ?
        createChildrenProxy(childrenToProxy, childPropType, path.concat(key)):
        createChildrenProxy(childrenToProxy[key], childPropType)
    }
  })
}

