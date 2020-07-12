const webpack = require('webpack');
const path = require('path');
const cwd = process.cwd();
const fs = require('fs');
const moduleRules = require('./module-rules');
const envConfig = require('./env-config');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CaseSensitivePathPlugin = require('case-sensitive-paths-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const nodeExternals = require('webpack-node-externals');
const LoadablePlugin = require('@loadable/webpack-plugin');

const plugins = [
    new webpack.ProgressPlugin(),
    new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'process.env.DEPLOY_ENV': JSON.stringify(process.env.DEPLOY_ENV),
    }),
    new CleanWebpackPlugin(),
    new CaseSensitivePathPlugin(),
    new LoadablePlugin(),
];
if(isDev){
    plugins.push(new webpack.HotModuleReplacementPlugin());
    plugins.push(new webpack.NamedModulesPlugin());
}else{
    plugins.push(new MiniCssExtractPlugin({
        filename: 'css/[name].[contenthash].css',
        chunkFilename: 'chunks/[id].[contenthash].css',
    }));
}

module.exports = {
    target: 'node',
    entry: path.resolve(cwd, 'src/server/app'),
    output: {
        path: path.resolve(cwd, 'dist/server'),
        filename: isDev ? '[name].js': '[name].[contentHash].js',
        chunkFilename: isDev ? 'chunks/[name].[hash].js' : 'chunks/[name].[contentHash].js',
        publicPath: '/',
    },
    externals: [
        nodeExternals()
    ],
    resolve: {
        extensions: ['.ts', '.tsx', '.scss', '.js', '.jsx', '.sass'],
        alias: {
            "@client": path.resolve(cwd, 'src/client'),
            "@server": path.resolve(cwd, 'src/server'),
        }
    },
    module: {
        rules: moduleRules(true),
    },
    plugins,
    watch: isDev,
    devServer: isDev ? {
        contentBase: path.resolve(cwd, 'src/client'),
        historyApiFallback: true,
        compress: true,
        host: envConfig.host,
        port: envConfig.clientPort,
        hot: true,
        open: true,
        watchOptions: {
            ignored: /node_modules/,    // 监听过多文件会占用cpu、内存，so，可以忽略掉部分文件
            aggregateTimeout: 200,  // 默认200，文件变更后延时多久rebuild
            poll: false,    // 默认false，如果不采用watch，那么可以采用poll（轮询）
        },
    } : undefined,
    devtool: isDev ? "inline-source-map": undefined,
}