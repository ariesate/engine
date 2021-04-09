module.exports = {
  esbuild: {
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment'
  },
  css: {
    preprocessorOptions: {
      less: { javascriptEnabled: true }
    }
  },
  optimizeDeps: {
    // include: ['axios', '@ant-design/icons-svg/es/helpers']
  },
  define: {
    __DEV__: true
  }
}