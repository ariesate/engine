import path from 'path'
import setDisplayNamePlugin from './plugins/setDisplayName.js'

function makePath(relativePath) {
  return path.join(path.dirname(import.meta.url.replace('file:', '')), relativePath)
}

const PACKAGE_ROOT_PATH = makePath('../')

export default {
  esbuild: {
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment'
  },
  plugins: [setDisplayNamePlugin],
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
	optimizeDeps: {
  	include: ['axios', '@ant-design/icons-svg/es/helpers']
	},
  define: {
    __DEV__: true
  },
  build: {
    rollupOptions: {
      input: {
        main: makePath('index.html'),
        playground: makePath( 'playground.html')
      }
    }
  },
  base: '/axii-component-site/',
  assetsInclude: [/\.jst/]
}