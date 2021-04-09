import path from 'path'

function makePath(relativePath) {
  return path.join(path.dirname(import.meta.url.replace('file:', '')), relativePath)
}

const PACKAGE_ROOT_PATH = makePath('../')

export default {
  esbuild: {
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment',
  },
  resolve: {
    alias: [
      {find: 'axii', replacement: path.resolve(PACKAGE_ROOT_PATH, './controller-axii/src')},
      {find: '@ariesate/are', replacement: path.resolve(PACKAGE_ROOT_PATH, './engine')},
    ]
  },
  css: {
    preprocessorOptions: {
      less: { javascriptEnabled: true }
    }
  },
  define: {
    __DEV__: true
  },
  build: {
    lib: {
      entry: makePath('./src/index.js'),
      name: 'axii',
    },
  }
}