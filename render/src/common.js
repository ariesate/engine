import { compact, flatten, each } from './util'

/* eslint-disable no-useless-escape*/
const PATH_ID = /[\[\]\.]+/

function walkFrom(a, b) {
  const final = [...a]
  let current = b.shift()
  while (current !== undefined) {
    switch (current) {
      case '<-':
        final.pop()
        break
      default:
        final.push(current)
    }
    current = b.shift()
  }
  return final
}

function seal(path) {
  return path.filter(p => p.trim() !== '').join('.')
}

export function relative(originPath, relativePath) {
  const origin = originPath.split(PATH_ID)
  const next = relativePath.split(PATH_ID)
  return seal(walkFrom(origin, next))
}

export class StatePath extends String {
  constructor(str) {
    super(str)
    this.str = str
  }

  valueOf() {
    return this.str.valueOf()
  }

  toString() {
    return this.str.toString()
  }

  relative(relativePath) {
    return relative(this.toString(), relativePath)
  }

  explode() {
    return this.toString().split('.')
  }

  get(index) {
    const exploded = this.explode()
    return exploded[(exploded.length + index) % exploded.length]
  }

}

export function isAncestorPath(target, source) {
  /* eslint-disable no-useless-escape */
  const exp = new RegExp(`^${target.replace(/\./g, '\\.')}\.`)
  return exp.test(source)
}

export function isDescendantPath(target, source) {
  return isAncestorPath(source, target)
}


export function joinPath(path = []) {
  return flatten(compact(path).map(p => p.split('.'))).join('.')
}

/*
 scope 里面记录了
 {
 componentPath // 组件树
 statePath   // 当前一层绑定数据的 path
 scopeIndex // 当前这一层数据的 scope
 relativeChildStatePath // 子节点绑定的数据 path
 }
 */
export function resolveStatePath(scopes = [], statePath, scopeIndex) {
  if (scopes.length === 0) return statePath

  let lastRootIndex = -1
  for (let i = scopes.length - 1; i > -1; i--) {
    if (scopes[i].isRoot === true) {
      lastRootIndex = i
      break
    }
  }


  const lastRootScope = lastRootIndex === -1 ? { statePath: '' } : scopes[lastRootIndex]
  const afterRootScope = scopes.slice(lastRootIndex + 1)
  const finalScopeIndex = scopeIndex === undefined ? afterRootScope.length - 1 : scopeIndex
  return joinPath([[lastRootScope].concat(afterRootScope)[finalScopeIndex + 1].statePath, statePath])
}

export function isPromiseLike(obj) {
  return typeof obj.then === 'function' && typeof obj.catch === 'function'
}

export function cancelable(q) {
  let fnToCall = null
  return {
    then(fn) {
      fnToCall = fn
      return q.then((...args) => {
        if (typeof fnToCall === 'function') {
          fnToCall(...args)
        }
      })
    },
    cancel() {
      fnToCall = null
    },
    catch(fn) {
      return q.catch(fn)
    },
  }
}

export function walkStateTree(startStateNode, prefixPath, handler, contextPath = []) {
  if (typeof startStateNode !== 'object') return

  if (startStateNode._id !== undefined) {
    const result = handler(startStateNode, contextPath)
    // 支持通过返回 false 提前结束
    if (result === false) return
  }

  each(startStateNode, (v, key) => {
    if (typeof v === 'object') {
      const nextStatePath = joinPath([prefixPath, key])
      walkStateTree(v, nextStatePath, handler, contextPath.concat(nextStatePath))
    }
  })
}

export function createOneToManyContainer(allowDuplicate = false) {
  const data = {}

  function insert(id, item) {
    if (data[id] === undefined) {
      data[id] = []
    }
    if (allowDuplicate || !data[id].includes(item)) {
      data[id].push(item)
      return true
    }
    return false
  }

  function remove(id, item) {
    data[id] = data[id].filter(i => i !== item)
    if (data[id].length === 0) {
      delete data[id]
    }
  }

  function get(id) {
    return data[id]
  }

  return {
    insert,
    remove,
    get,
  }
}
