const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin');

const packagePath = path.resolve(__dirname, '../../')

const isDevMode = process.env.NODE_ENV === 'dev'

const config = {
  entry: {
    // basic: './index.js',
    reactive: './reactive.js',
    ref: './ref.js',
    vnodeComputed: './vnodeComputed.js',
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
    // new HtmlWebpackPlugin({
    //   title: 'AXII basic Example',
    //   chunks: ['basic'],
    //   filename: 'basic.html',
    //   template: 'common-template.html'
    // }),
    new HtmlWebpackPlugin({
      title: 'AXII reactive Example',
      chunks: ['reactive'],
      filename: 'reactive.html',
      template: 'common-template.html'
    }),
    new HtmlWebpackPlugin({
      title: 'AXII ref Example',
      chunks: ['ref'],
      filename: 'ref.html',
      template: 'common-template.html'
    }),
    new HtmlWebpackPlugin({
      title: 'AXII vnodeComputed Example',
      chunks: ['vnodeComputed'],
      filename: 'vnodeComputed.html',
      template: 'common-template.html'
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      __DEV__: true,
    })
  ],

}



config.resolve = {
  alias: {
    axii: path.resolve(packagePath, 'controller-axii/src/index.js'),
    '@ariesate/are': path.resolve(packagePath, 'engine'),
  },
}

module.exports = config
