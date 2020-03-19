import enginePropTypes, { createNormalType } from '@ariesate/are/propTypes'

export default {
  ...enginePropTypes,
  callback: createNormalType('function', {
    stringify(v) { return v.toString() },
    // eslint-disable-next-line no-new-func
    parse(v) { return new Function(v) },
  }),
  slot: createNormalType((v) => {
    return (typeof v === 'object' && !Array.isArray(v))
  }, { zeroValue: null })
}