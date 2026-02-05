const path = require('path');

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
};

export default config;
