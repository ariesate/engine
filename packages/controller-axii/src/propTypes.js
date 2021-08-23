import enginePropTypes, { createNormalType } from '@ariesate/are/propTypes'

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
  }, { zeroValue: null })
}