const webpack = require('webpack')
const path = require('path')

module.exports = {
  entry: {
    index: './pages/index.js',
    form: './pages/form/index.js',
    repeatInForm: './pages/repeatInForm/index.js',
    basic: './pages/basic/index.js',
    fragment: './pages/fragment/index.js',
    dynamicRender: './pages/dynamicRender/index.js',
    preview: './pages/preview/index.js',
    steps: './pages/steps/index.js',
    reactRouter: './pages/react-router/index.js',
    manual: './pages/manual/index.js',
    devtool: './pages/devtool/index.js',
    fragmentAndDynamicRender: './pages/fragmentAndDynamicRender/index.js',
    naiveRender: './pages/naiveRender/index.js',
    repeat: './pages/repeat/index.js',
    todo: './pages/todo/index.js',
  },
  output: {
    filename: '[name].js',
    publicPath: '/pages/',
  },
  module: {
    rules: [
      { test: /\.js?$/, exclude: /node_modules/, loader: 'babel-loader' },
    ],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
  resolve: {
    alias: {
      '@cicada/render/lib' : path.resolve(__dirname, 'render/src'),
      '@cicada/devtool/lib' : path.resolve(__dirname, 'devtool/src'),
    },
  },
}
