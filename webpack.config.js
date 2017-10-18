const webpack = require('webpack')
const path = require('path')

module.exports = {
  entry: {
    basic: './examples/basic/index.js',
    key: './examples/key/index.js',
    vnodeArray: './examples/vnodeArray/index.js',
    cnodeKey: './examples/cnodeKey/index.js',
    listener: './examples/listener/index.js',
    controlled: './examples/controlled/index.js',
    lifecycle: './examples/lifecycle/index.js',
    cnodeTransferKey: './examples/cnodeTransferKey/index.js',
    mst: './examples/mst/index.js',
  },
  output: {
    filename: '[name].js',
    publicPath: '/examples/',
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
      '@ariesate/render': path.resolve(__dirname, 'render/src'),
    },
  },
}
