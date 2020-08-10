const path = require('path')

const packagePath = path.resolve(__dirname, '../../')

module.exports = {
  jsx: {
    factory: 'createElement',
    fragment: 'Fragment'
  },
  alias: {
    'lodash': '@/lodash',
    '/@axii/': path.resolve(packagePath, 'controller-axii/src'),
    '/@ariesate/are/': path.resolve(packagePath, 'engine'),
  }
}