import enginePropTypes, { createNormalType, createTypeClass } from '@ariesate/are/propTypes'
import VNode from '@ariesate/are/VNode'
import Fragment from "@ariesate/are/Fragment";

// TODO 如何支持各种格式对 ref 的支持？？
export default {
  ...enginePropTypes,
  callback: createNormalType('function', {
    stringify(v) { return v.toString() },
    // eslint-disable-next-line no-new-func
    parse(v) { return new Function(v) },
  }),
  feature: createNormalType('bool', { zeroValue: false }),
  slot: createNormalType((v) => {
    return (typeof v === 'object' && !Array.isArray(v))
  }, { zeroValue: null }),
  // element: createNormalType(() => true),
  // 里面可以传参数，参数可以继续约定 props
  element: createTypeClass({
    check:(v) => {
      return v instanceof VNode || null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
    },
    stringify(v) {
      // TODO
      // stringify 时 element 里面有，[ 等符号怎么办
    },
    parse(v) {
      // TODO
    },
  })
}