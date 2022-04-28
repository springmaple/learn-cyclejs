const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: { loader: 'babel-loader' }
            }
        ],
    },
    plugins: [ new HtmlWebpackPlugin({ template: './src/index.html' }) ],
    mode: "development",
    devServer: {
        historyApiFallback: true
    },
    output: {
        publicPath: "/"  // https://stackoverflow.com/a/34628034/1640033
    }
};
