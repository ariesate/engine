import path from 'path'
// import setDisplayNamePlugin from './plugins/setDisplayName.js'

function makePath(relativePath) {
  return path.join(path.dirname(import.meta.url.replace('file:', '')), relativePath)
}

const PACKAGE_ROOT_PATH = makePath('../')

export default {
  esbuild: {
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment'
  },
  // plugins: [setDisplayNamePlugin],
  // resolve: {
  //   alias: [
  //     {find: 'axii', replacement: path.resolve(PACKAGE_ROOT_PATH, './controller-axii/src')},
  //     {find: '@ariesate/are', replacement: path.resolve(PACKAGE_ROOT_PATH, './engine')},
  //   ]
  // },
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
    polyfillDynamicImport:false,
    chunkSizeWarningLimit: 1024,
    // lib: {
    //   entry: makePath('./src/index.js'),
    //   name: 'axiiComponents',
    //   formats: ['es']
    // },
    outDir: 'dist',
    rollupOptions: {
      external: ['axii'],
      output: {
        entryFileNames: '[name].js',
        format: 'es'
      }
    }
  }
}