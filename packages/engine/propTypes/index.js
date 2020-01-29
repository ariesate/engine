/**
 * 用法：直接用最后导出的函数就是验证函数。
 * 增强：
 * propType.zeroValue 获取零值。
 * propType.is 可以用来判断是否是某种类型 propType.is(propTypes.func)
 * propType.default(() => defaultValue) 用于生成带有 defaultValue 的 propType
 * propType.required 生成带有 isRequired 标记的 propType
 *
 */

import internalCheckPropTypes from './checkPropTypes'

function isStringLike(v) {
  const type = typeof v
  return (type === 'string' || type === 'number')
}


// TODO zero-value
// 这个写法是为了兼容 react 的 prop-types
export function createTypeClass(definition) {
  function Type(...argv) {
    function TypeChecker(v) {
      if (!TypeChecker.check(v)) return new Error('type check failed')
    }

    TypeChecker.argv = argv
    TypeChecker.stringify = definition.stringify.bind(TypeChecker)
    TypeChecker.parse = definition.parse.bind(TypeChecker)
    TypeChecker.check = definition.check.bind(TypeChecker)
    TypeChecker.is = definition.is || (t => t === Type)
    TypeChecker.zeroValue = definition.zeroValue
    TypeChecker.required = definition.required

    if (!TypeChecker.required) {
      Object.defineProperty(TypeChecker, 'isRequired', {
        get() {
          return createTypeClass({
            ...definition,
            required: true,
            // CAUTION 注意这里 isRequired.is 和之前一样
            is: TypeChecker.is,
          })(...argv)
        },
      })
    }

    return TypeChecker
  }

  return Type
}


export function createNormalType(type, definition = {}) {
  const {
    stringify = JSON.stringify, parse = JSON.parse, is,
    ...rest
  } = definition
  function TypeChecker(v) {
    if (typeof type === 'function') {
      if (!type(v)) {
        return new Error(`${v} type check failed`)
      }
    }
    if (typeof type === 'string') {
      if (typeof v !== type) {
        return new Error(`${v} is not ${type}`)
      }
    }
  }

  TypeChecker.stringify = stringify
  TypeChecker.parse = parse
  TypeChecker.check = (v) => {
    return (typeof type === 'string') ? (typeof v) === type : type(v)
  }
  TypeChecker.is = is || (t => t === TypeChecker)

  Object.assign(TypeChecker, rest)

  if (!TypeChecker.required) {
    Object.defineProperty(TypeChecker, 'isRequired', {
      get() {
        return createNormalType(type, {
          ...definition,
          required: true,
          is: TypeChecker.is,
        })
      },
    })
  }

  if (!TypeChecker.createDefaultValue) {
    Object.defineProperty(TypeChecker, 'default', {
      get() {
        return (createDefaultValue) => createNormalType(type, {
          ...definition,
          required: TypeChecker.required,
          createDefaultValue,
          is: TypeChecker.is,
        })
      },
    })
  } else {
    Object.defineProperty(TypeChecker, 'defaultValue', {
      get() {
        if (TypeChecker.createDefaultValue) return TypeChecker.createDefaultValue()
      },
    })
  }

  return TypeChecker
}


export const oneOf = createTypeClass({
  stringify(v) {
    if (v === null) return ''
    return isStringLike(this.argv[0][0]) ? v.toString() : JSON.stringify(v)
  },
  parse(v) {
    return !isStringLike(this.argv[0][0])
      ? JSON.parse(v)
      : ((typeof this.argv[0][0]) === 'string' ? v : parseFloat(v))
  },
  check(v) {
    return this.argv[0].includes(v)
  },
  zeroValue: [],
})

// TODO 要改成普通JSON.stringify, 剩下的让 editor 处理。
export const string = createNormalType('string', {
  zeroValue: '',
})

export const number = createNormalType('number', {
  stringify(v) { return v.toString() },
  parse(v) {
    if (/-?\d+(\.\d+)?/.test(v)) return parseFloat(v)
    throw new Error(`${v} is not a number`)
  },
  zeroValue: 0,
})

export const object = createNormalType((v) => {
  return (typeof v === 'object' && !Array.isArray(v))
}, { zeroValue: null })

export const array = createNormalType((v) => {
  return Array.isArray(v)
})

export const bool = createNormalType('bool', { zeroValue: false })

export const func = createNormalType('function', {
  stringify(v) { return v.toString() },
  // eslint-disable-next-line no-new-func
  parse(v) { return new Function(v) },
})

export const symbol = createNormalType('symbol')

export const any = createNormalType(() => true, {
  stringify() {
    throw new Error('type any can not stringify')
  },
  parse() {
    throw new Error('type any can not parse')
  },
  check() {
    throw new Error('type any can not check')
  },
})

export const oneOfType = createTypeClass({
  check(v) {
    return this.argv[0].some(propType => propType.check(v))
  },
  stringify(v) {
    const propType = this.argv[0].find(propType => !(propType(v) instanceof Error))
    return propType.stringify(v)
  },
  parse(v) {
    // TODO 每个都准备 parse 一下
    let result
    const haveResult = this.argv[0].some((propType) => {
      try {
        const parsed = propType.parse(v)
        if (!(this.check(parsed) instanceof Error)) {
          result = parsed
          return true
        }
      } catch (e) {

      }
    })

    if (!haveResult) throw new Error(`can not parse ${v}`)
    return result
  },
})

export const arrayOf = createTypeClass({
  check(v) {
    if (!Array.isArray(v)) return false
    // TODO of type?
    return v.every(e => this.argv[0].check(e))
  },
  stringify(v) {
    // TODO
    // stringify 时 element 里面有，[ 等符号怎么办
    // 应该始终都用 JSON 格式，至于 editor 要不要有自己的 stringify/parse ，那是它的事情。
  },
  parse(v) {
    // TODO
  },
  zeroValue: [],
})


export const shape = createTypeClass({
  check(v) {
    return true
  },
  stringify(v) {
    // TODO
    // stringify 时 element 里面有，[ 等符号怎么办
  },
  parse(v) {
    // TODO
  },
})

export const map = createTypeClass({
  check(v) {
    return Object.entries(this.argv[0]).every(([key, propType]) => propType.check(v[key]))
  },
  stringify(v) {
    // 注意里面对 propType.stringify 结果又用了一次 JSON.stringify 是为了转义双引号
    return `{${Object.entries(this.argv[0]).map(([key, propType]) => {
      return `${key}:${JSON.stringify(propType.stringify(v[key]))}`
    }).join(',')}`
  },
  parse(v) {
    const map = JSON.parse(v)
    Object.keys(map).forEach((key) => {
      map[key] = this.argv[0][key].parse(map[key])
    })
    return map
  },
})


// TODO node/elementType
export const node = any
export const element = any
export const elementType = any

export const checkPropTypes = internalCheckPropTypes
export default {
  string,
  number,
  object,
  array,
  bool,
  func,
  symbol,
  node,
  element,
  elementType,
  // instanceOf

  oneOf,
  oneOfType,
  arrayOf,
  // objectOf,
  shape,
  map,
  // exact,
  // customProps/customArrayProps
  any,
  checkPropTypes,
}
