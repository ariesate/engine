export default {
  esbuild: {
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment'
  },
  // alias: [
  //   {find: 'axii-components', replacement: path.resolve(PACKAGE_ROOT_PATH, './axii-components/src')},
  //   {find: 'axii', replacement: path.resolve(PACKAGE_ROOT_PATH, './controller-axii/src')},
  //   {find: '@ariesate/are', replacement: path.resolve(PACKAGE_ROOT_PATH, './engine')},
  // ],
  css: {
    preprocessorOptions: {
      less: { javascriptEnabled: true }
    }
  },
  build: {
    lib: {
      entry : './src/index.js',
      name: 'axii-x6'
    },
    rollupOptions: {
      external: ['axii'],
      output: {
        globals: {
          axii: 'Axii'
        }
      }
    }
  },
  define: {
    __DEV__: true
  }
}