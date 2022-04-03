const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

const isProd = process.env.NODE_ENV === 'production'

module.exports = {
    entry: './src/assets/js/main.js',
    mode: isProd ? 'production' : 'development',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'main.js',
    },
    module: {
      rules: [
          {
              test: /\.css$/,
              use: ['style-loader', 'css-loader']
          }
      ]
    },
    plugins: [
        isProd && new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './src/index.html'
        }),
        new HtmlWebpackPlugin({
            filename: 'twitter.html',
            template: './src/twitter.html'
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: "./src/assets", to: "assets" },
            ],
        }),
    ].filter(Boolean),
    devServer: {
        contentBase: './src',
        compress: true,
        port: 4000,
        quiet: true,
    },
}
