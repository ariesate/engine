const webpack = require('webpack')
const path = require('path')

const isDevMode = process.env.NODE_ENV === 'dev'

const config = {
  entry: {
    simple: './simple/index.js',
    key: './key/index.js',
    vnodeArray: './vnodeArray/index.js',
    cnodeKey: './cnodeKey/index.js',
    listener: './listener/index.js',
    controlled: './controlled/index.js',
    lifecycle: './lifecycle/index.js',
    cnodeTransferKey: './cnodeTransferKey/index.js',
    mst: './mst/index.js',
    retArray: './retArray/index.js',
    deepBind: './deepBind/index.js',
  },
  output: {
    filename: '[name].js',
    publicPath: '/',
  },
  module: {
    rules: [
      { test: /\.js?$/, exclude: /node_modules/, loader: 'babel-loader' },
    ],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
}

if (isDevMode) {
  const packagePath = path.resolve(__dirname, '../../packages')

  config.resolve = {
    alias: {
      novice: path.resolve(packagePath, 'controller-novice/src'),
      '@ariesate/are': path.resolve(packagePath, 'engine/src'),
    },
  }
}

module.exports = config
