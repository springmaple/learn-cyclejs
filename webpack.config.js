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
};
