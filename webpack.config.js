import { resolve as _resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = _resolve(__filename, '..');

const config = {
  entry: {
    EnvTypesPlugin: './src/EnvTypesPlugin.ts',
    EnvTypesGenerator: './src/EnvTypesGenerator.ts',
  },
  output: {
    path: _resolve(__dirname, 'dist'),
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
