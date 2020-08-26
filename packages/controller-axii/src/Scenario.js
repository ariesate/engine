import { invariant } from './util';

/**
 * 用法
 * this.ruleName().ruleName2().xxxValue()
 * 见 AXII component pattern。
 */

export default class Scenario {
  constructor(index, values) {
    // 获取指的函数
    Object.keys(values).forEach((name) => {
      this[name] = (offset) => {
        return values[name](this.rules, offset)
      }
    })

    this.rules = {}
    Object.entries(index).forEach(([ruleName, ruleValues]) => {
      invariant(!Object.keys(values).some(({ name }) => name === ruleName), `${ruleName} is a value name` )
      this.rules[ruleName] = undefined
      if (typeof ruleValues === 'object') {
        Object.entries(ruleValues).forEach(([subKey, subValue]) => {
          this[subKey] = () => {
            this.rules[ruleName] = subValue
            return this
          }
        })
      } else {
        this[ruleName] = () => {
          this.rules[ruleName] = ruleValues
          return this
        }
      }

    })
  }
}

export function createRange(values, baseIndex) {
  return function getValue(offset = 0) {
    const index = baseIndex + offset
    const range = [0, values.length -1]
    return values[index < range[0] ? 0 : (index > range[1] ? range[1] : index)]
  }
}

export function matrixMatch(conditionValues, matrix) {
  const matchedRule = matrix.find((thisConditionValues) => {
    return conditionValues.every((conditionValue, i) => {
      return thisConditionValues[i] === conditionValue
    })
  })
  // 必须有默认值。

  invariant(matchedRule, 'rule not exist')
  return matchedRule[matchedRule.length - 1]
}