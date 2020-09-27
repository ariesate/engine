const path = require( 'path')
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
    entry: {
        panel: './src/panel.js',
        localDev: './src/localDev.js',
    },
    mode: 'development',
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname)
    },
    devtool: 'inline-source-map',
    plugins: [
        new HtmlWebpackPlugin({
            title: 'panel',
            chunks: ['localDev'],
            filename: 'local.html',
            template: 'common-template.html'
        }),
    ],
    module: {
        rules: [
            { test: /\.js?$/, exclude: /node_modules/, loader: 'babel-loader' },
            { test: /\.css$/, use: ['style-loader', 'css-loader'] },
        ],
    },
    resolve: {
        alias: {
            'axii': path.resolve('../../controller-axii/src/index.js'),
            '@ariesate/are': path.resolve('../../engine'),
        },
    },
    watchOptions: {
        ignored: /node_modules/,
        aggregateTimeout: 200,
        poll: 1000
    }
}