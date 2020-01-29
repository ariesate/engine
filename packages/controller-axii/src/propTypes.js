import enginePropTypes, { createNormalType } from '../../engine/propTypes'

export default {
  ...enginePropTypes,
  callback: createNormalType('function', {
    stringify(v) { return v.toString() },
    // eslint-disable-next-line no-new-func
    parse(v) { return new Function(v) },
  })
}