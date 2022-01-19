import path from 'path'
import siteConfig from './vite.config.js'

function makePath(relativePath) {
  return path.join(path.dirname(import.meta.url.replace('file:', '')), relativePath)
}

const PACKAGE_ROOT_PATH = makePath('../../')

export default {
  ...siteConfig,
  define: {
    __DEV__: true
  },
  resolve: {
    alias: [
      {find: 'axii', replacement: path.resolve(PACKAGE_ROOT_PATH, './controller-axii/src')},
      {find: 'yrden', replacement: path.resolve(PACKAGE_ROOT_PATH, './yrden/src')},
      {find: /^axii-icons\/(\w+)(.js)?$/i, replacement: `${path.resolve(PACKAGE_ROOT_PATH, './axii-icons/src')}/$1.jsx`},
      {find: '@ariesate/are', replacement: path.resolve(PACKAGE_ROOT_PATH, './engine')},
      {find: 'axii-components', replacement: path.resolve(PACKAGE_ROOT_PATH, './axii-components/src')},
    ]
  }
}