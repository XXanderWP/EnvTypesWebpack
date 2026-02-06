const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const config = {
  entry: {
    EnvTypesPlugin: './src/EnvTypesPlugin.ts',
    EnvTypesGenerator: './src/EnvTypesGenerator.ts',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    library: {
      type: 'commonjs2',
    },
    clean: true,
  },
  target: 'node',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  externals: {
    webpack: 'webpack',
  },
  optimization: {
    minimize: false,
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/types',
          to({ context, absoluteFilename }) {
            // сохраняем структуру src → dist
            return path.relative(
              path.resolve(__dirname, 'src'),
              absoluteFilename
            );
          },
        },
      ],
    }),
  ],
};

module.exports = config;
