const path = require('path');
const nodeBuiltins = require('builtin-modules');
const externals = ['aws-sdk']
    .concat(nodeBuiltins)
    .reduce((externalsMap, moduleName) => {
        externalsMap[moduleName] = moduleName;
        return externalsMap;
    }, {});

module.exports = {
    entry: {
        './lambda': './lambda.ts',
    },
    target: "node",
    externals,
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.json'],
    },
    output: {
        libraryTarget: 'commonjs',
        path: path.resolve(__dirname, '.webpack'),
        filename: '[name].js',
    },
    module: {
        loaders: [{
            test: /\.tsx?$/,
            loaders: ['awesome-typescript-loader']
        }]
    }
};