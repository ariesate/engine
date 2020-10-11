const path = require( 'path')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RemoveStrictPlugin = require( 'remove-strict-webpack-plugin' );
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
        new MiniCssExtractPlugin({
            filename: '[name].css'
        }),
        new HtmlWebpackPlugin({
            title: 'panel',
            chunks: ['localDev'],
            filename: 'local.html',
            template: 'common-template.html'
        }),
        new RemoveStrictPlugin(),
    ],
    module: {
        rules: [
            {
                test: /\.js?$/,
                exclude: /node_modules/,
                loader: 'babel-loader',

            },
            {
                test: /\.(less|css)$/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'less-loader',
                    }
                ]
            },
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