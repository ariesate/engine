export function compact(path = []) {
  // only positive values
  return path.filter(p => Boolean(p))
}

export function concat(fns) {
  const finalFns = compact(fns)
  return (...args) => {
    return finalFns.map((fn) => {
      return typeof fn === 'function' && fn(...args)
    })
  }
}

export function chain(fns, spreadArgs = false) {
  return base => fns.reduce((last, fn) => {
    return spreadArgs ? fn(...last) : fn(last)
  }, base)
}

export function compose(fns) {
  if (fns.length === 0) {
    return arg => arg
  }

  if (fns.length === 1) {
    return fns[0]
  }

  return fns.reduce((a, b) => (...args) => a(b(...args)))
}

export function warning(message) {
  /* eslint-disable no-console */
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message)
  }
  /* eslint-enable no-console */
  try {
    // This error was thrown as a convenience so that if you enable
    // "break on all exceptions" in your console,
    // it would pause the execution at this line.
    throw new Error(message)
    /* eslint-disable no-empty */
  } catch (e) {
  }
  /* eslint-enable no-empty */
}

export function invariant(condition, format, a, b, c, d, e, f) {
  if (format === undefined) {
    throw new Error('invariant requires an error message argument');
  }

  if (!condition) {
    debugger
    let error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      let args = [a, b, c, d, e, f];
      let argIndex = 0;
      error = new Error(
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
}

export function result(valueOrFn, ...args) {
  return (typeof valueOrFn === 'function') ? valueOrFn(...args) : valueOrFn
}

export function intersection(...arrays) {
  let output = []
  arrays[0].forEach((item) => {
    if (arrays[1].indexOf(item) !== -1) {
      output.push(item)
    }
  })
  if (arrays.length > 2) {
    output = intersection(result, ...arrays.slice(2))
  }
  return output
}

export const keys = Object.keys

export function reduce(obj, handler, initial = {}) {
  return keys(obj).reduce((last, key) => handler(last, obj[key], key), initial)
}

export function filter(obj, handler) {
  return reduce(obj, (last, item, key) => (handler(item, key) ? { ...last, [key]: item } : last))
}

export function map(obj, handler) {
  return keys(obj).map((key) => {
    return handler(obj[key], key)
  })
}

export function mapValues(obj, handler) {
  return reduce(obj, (last, value, key) => ({ ...last, [key]: handler(value, key) }))
}

export function pick(obj, names) {
  return filter(obj, (v, name) => names.indexOf(name) !== -1)
}

export function omit(obj, names) {
  return filter(obj, (v, name) => names.indexOf(name) === -1)
}

export function compile(str) {
  const literals = str.split(/\${[^}]+}/)
  const reg = /\${([^}]+)}/g
  let m = reg.exec(str)
  const exps = []
  while (Array.isArray(m)) {
    exps.push(m[1])
    m = reg.exec(str)
  }
  if (literals.length !== exps.length + 1) {
    return ''
  }
  let res = `'${literals[0].replace(/'/g, "\\'")}'`
  for (let i = 1; i < literals.length; i++) {
    res += ` + (function(){var re = (${exps[i - 1]});return re == null ? '' : re}())`
    res += ` + '${literals[i].replace(/'/g, "\\'")}'`
  }
  return res
}

/* eslint-disable no-new-func */
export function resolve(obj, exp, utils, context = null) {
  const argvKeys = Object.keys(obj)
  const argvValues = argvKeys.map(k => obj[k])
  const utilKeys = Object.keys(utils)
  const utilValues = utilKeys.map(k => utils[k])
  const resultCode = compile(exp)
  return (new Function(...argvKeys, ...utilKeys, `return ${resultCode}`)).call(context, ...argvValues, ...utilValues)
}

export function each(obj, fn) {
  return keys(obj).forEach((k) => {
    fn(obj[k], k)
  })
}

export function defaults(obj, defaultsObj) {
  return { ...defaultsObj, ...obj }
}

export function different(a, b) {
  if (!b || !a) {
    return a === b
  }
  return reduce(b, (last, value, key) => (value !== a[key] ? last.concat({ key, value }) : last)
    , [])
}

export const SUPPORTED_TAGS = [
  'a',
  'br',
  'dd',
  'del',
  'div',
  'dl',
  'dt',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'iframe',
  'img',
  'label',
  'li',
  'ol',
  'p',
  'pre',
  'span',
  'ul',
]

export function isPrimitiveType(type) {
  return SUPPORTED_TAGS.indexOf(type) !== -1
}

export function indexBy(arr, key) {
  return arr.reduce((last, v, index) => ({ ...last, [key === undefined ? index : v[key]]: v }), {})
}

export function values(obj) {
  return keys(obj).map(k => obj[k])
}

export function shallowEqual(objA, objB) {
  if (objA === objB) {
    return true;
  }

  if (!objA || !objB) {
    return false;
  }

  const aKeys = Object.keys(objA);
  const bKeys = Object.keys(objB);
  const len = aKeys.length;

  if (bKeys.length !== len) {
    return false;
  }

  for (let i = 0; i < len; i++) {
    const key = aKeys[i];

    if (objA[key] !== objB[key] || !Object.prototype.hasOwnProperty.call(objB, key)) {
      return false;
    }
  }

  return true;
}

export function partial(fn, ...argv) {
  return (...rest) => fn.call(this, ...argv, ...rest)
}

export function partialRight(fn, ...argv) {
  return (...rest) => fn.call(this, ...rest, ...argv)
}

/* eslint-disable eqeqeq */
export function isNegative(obj) {
  if (obj == undefined) {
    return true
  } else if (Array.isArray(obj)) {
    return obj.length === 0
  } else if (typeof obj === 'object') {
    return Object.keys(obj).length === 0
  } else if (typeof obj === 'string') {
    return obj === ''
  }
  return false
}

export function subtract(all, part) {
  return all.reduce((subResult, name) => (part.indexOf(name) === -1 ? subResult.concat(name) : subResult), [])
}

export function find(obj, checker) {
  const findName = Object.keys(obj).find(key => checker(obj[key], key))
  return findName !== undefined ? obj[findName] : undefined
}

export function findIndex(obj, checker) {
  return Object.keys(obj).find(key => checker(obj[key], key))
}

export function collect(arr) {
  return arr.reduce((obj, current) => {
    obj[current[0]] = current[1]
    return obj
  }, {})
}

export function isObject(a) {
  return typeof a === 'object' && !Array.isArray(a) && a !== null
}

export function walk(obj, childrenName, handler, path = []) {
  handler(obj, path)
  if (obj[childrenName] !== undefined && Array.isArray(obj[childrenName])) {
    obj[childrenName].forEach((child, index) => walk(child, childrenName, handler, path.concat([childrenName, index])))
  }
}

export function inject(fn, createArgsToInject, spread = false) {
  return (...runtimeArgs) => {
    const injectArgs = createArgsToInject(...runtimeArgs)
    return spread ? fn(...injectArgs, ...runtimeArgs) : fn(injectArgs, ...runtimeArgs)
  }
}

export function every(i, fn) {
  return Array.isArray(i) ? i.every(fn) : Object.keys(i).every(k => fn(i[k], k))
}

export function noop() {}

export function invoke(obj, fn, args) {
  return obj[fn] !== undefined ? obj[fn](...args) : undefined
}

export function before(fn, beforeFn) {
  return (...args) => beforeFn(fn, ...args)
}

export function after(fn, afterFn) {
  return (...args) => concat([fn, afterFn])(...args)[0]
}

export function ensure(arr, item, batch) {
  const items = batch ? item : [item]
  items.forEach((i) => {
    if (!arr.includes(i)) { arr.push(i) }
  })
}

export function groupBy(arr, key) {
  return arr.reduce((output, item) => {
    if (output[item[key]] === undefined) output[item[key]] = []
    output[item[key]].push(item)
    return output
  }, {})
}

export function union(a, b = [], ...rest) {
  const firstResult = b.reduce((last, current) => (last.includes(current) ? last : last.concat(b)), a)
  return rest.length > 0 ? union(firstResult, rest.slice(1)) : firstResult
}

export function flatten(arr) {
  return arr.reduce((last, current) => last.concat(current), [])
}

export function remove(arr, item) {
  arr.splice(arr.findIndex(i => i === item), 1)
}


const LETTER_AND_NUMBER = 'abcdefghijklmnopqrstuvwxyz0123456789'
const LETTER_AND_NUMBER_LEN = LETTER_AND_NUMBER.length

export function createUniqueIdGenerator(prefix = '') {
  let last = ''
  let index = -1
  return () => {
    index = (index === LETTER_AND_NUMBER_LEN - 1) ? 0 : (index + 1)
    last = (index === 0 ? last : last.slice(0, last.length - 1)) + LETTER_AND_NUMBER[index]
    return `${prefix}_${last}`
  }
}

export function some(obj, check) {
  return Object.keys(obj).some(k => check(obj[k], k))
}

export function filterMap(obj, handler) {
  return reduce(obj, (r, current, key) => {
    const currentResult = handler(current, key)
    if (currentResult !== undefined) r[key] = currentResult
    return r
  })
}

export function diff(first, second) {
  const absent = []
  const newBee = second.slice()

  first.forEach((item) => {
    const index = newBee.indexOf(item)
    if (index === -1) {
      absent.push(item)
    } else {
      newBee.splice(index, 1)
    }
  })

  return [absent, newBee]
}

export function ensureArray(o) {
  return Array.isArray(o) ? o : [o]
}

export function replaceItem(arr, prev, next) {
  const index = arr.indexOf(prev)
  if (index !== -1) {
    arr[index] = next
  }
}

/**
 * CAUTION TODO 理论上我们应该完整的对时序进行管理:
 * 1. 提供 defer， 实现跳出当前栈的能力。主要是 watch 在用，因为 watch 是用 createComputed 实现的。
 * 每次 deps 变化都会自动运行，我们的 watch callback 也是写在这个里面，所以 callback 里面的 deps 也会被监听。这就超出预期了，
 * 触发再使用 stopTrack 强行阻止监听。用这种方式的话，如果 callback 里面还有要 track 的等，就又会需要用栈来实现 stopTrack，变得更复杂。
 * 目前看来是用 defer 等简单，也能符合语义。
 * TODO
 * 2. nextTick 来跳出事件循环
 * 3. nextPaint/nextDigest 来跳出当前的 session。
 */
export function deferred(fn) {
  return Promise.resolve().then(() => fn())
}

export function nextTask(callback) {
  setTimeout(callback, 16)
}
