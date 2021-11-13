const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/providers.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    devtool: 'source-map',
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            util: require.resolve('util/'),
            path: require.resolve('path-browserify'),
            buffer: require.resolve('buffer/'),
            os: require.resolve('os-browserify/browser'),
            url: require.resolve('url/'),
            stream: require.resolve('stream-browserify'),
            https: require.resolve('https-browserify'),
            assert: require.resolve('assert/'),
            http: require.resolve('stream-http'),
            fs: false,
        },
    },
    mode: 'development',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public'),
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: path.resolve(path.join(__dirname, 'node_modules/process/browser')),
        }),
    ],
};
