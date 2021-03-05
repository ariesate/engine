const path = require('path')
const setDisplayNamePlugin = require('./plugins/setDisplayName')

const PACKAGE_ROOT_PATH = path.resolve(__dirname, '../')

module.exports = {
  esbuild: {
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment'
  },
  plugins: [setDisplayNamePlugin],
  alias: [
    {find: 'axii-components', replacement: path.resolve(PACKAGE_ROOT_PATH, './axii-components/src')},
    {find: 'axii', replacement: path.resolve(PACKAGE_ROOT_PATH, './controller-axii/src')},
    {find: '@ariesate/are', replacement: path.resolve(PACKAGE_ROOT_PATH, './engine')},
  ],
  css: {
    preprocessorOptions: {
      less: { javascriptEnabled: true }
    }
  },
  optimizeDeps: {
    include: ['axios', '@ant-design/icons-svg/es/helpers']
  },
  define: {
    __DEV__: true
  }
}