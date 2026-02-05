# EnvTypesWebpack
<center>

[![npm version](https://img.shields.io/npm/v/@xxanderwp/env-types-webpack-plugin.svg)](https://www.npmjs.com/package/EnvTypesWebpack)
[![Tests](https://github.com/XXanderWP/EnvTypesWebpack/workflows/Tests/badge.svg)](https://github.com/XXanderWP/EnvTypesWebpack/actions)
[![license](https://img.shields.io/github/license/XXanderWP/EnvTypesWebpack.svg)](https://github.com/XXanderWP/EnvTypesWebpack/blob/main/LICENSE)

</center>

Webpack plugin that automatically generates TypeScript definitions for environment variables from `.env` files.

## Features

- 🚀 **Automatic generation** - Types are generated on every build and when `.env` files change
- 📝 **Comment preservation** - JSDoc comments from your `.env` files are included in generated types
- ⚡ **Fast rebuilds** - Generated `.d.ts` file is excluded from webpack watching
- 🎯 **TypeScript native** - Full TypeScript support with type definitions
- 🔧 **Configurable** - Customize file paths, watch patterns, and more
- 💪 **Zero dependencies** - No external runtime dependencies

## Installation

```bash
npm install --save-dev @xxanderwp/env-types-webpack-plugin
```

Or with yarn:

```bash
yarn add -D @xxanderwp/env-types-webpack-plugin
```

## Usage

### Basic Usage

```javascript
// webpack.config.js
const EnvTypesPlugin = require('@xxanderwp/env-types-webpack-plugin');

module.exports = {
  // ...
  plugins: [new EnvTypesPlugin('src/types/env.d.ts')],
};
```

### Advanced Configuration

```javascript
// webpack.config.js
const EnvTypesPlugin = require('@xxanderwp/env-types-webpack-plugin');

module.exports = {
  // ...
  plugins: [
    new EnvTypesPlugin({
      // Path to output .d.ts file (required)
      outputPath: 'src/types/env.d.ts',

      // List of .env files to watch (optional)
      envFiles: ['.env.local', '.env'],

      // Disable console output (optional)
      silent: false,
    }),
  ],
};
```

## Example

### Input (`.env` file):

```bash
# Database configuration
DB_HOST=localhost
DB_PORT=5432

# API Keys
API_KEY=your-api-key # Production key
```

### Output (`env.d.ts` file):

```typescript
// ⚠️ AUTO-GENERATED FILE — DO NOT EDIT
// Source: .env
// Generated: 2024-01-15T10:30:00.000Z

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * Database configuration
     */
    DB_HOST?: string;
    /**
     * Database configuration
     */
    DB_PORT?: string;
    /**
     * API Keys
     * Production key
     */
    API_KEY?: string;
  }
}

export {};
```

### Usage in Your Code:

```typescript
// Now you have full TypeScript autocomplete!
const dbHost = process.env.DB_HOST; // Type: string | undefined
const apiKey = process.env.API_KEY; // Type: string | undefined
```

## API

### `EnvTypesPlugin(options)`

#### Options

| Option            | Type       | Default                       | Description                                       |
| ----------------- | ---------- | ----------------------------- | ------------------------------------------------- |
| `outputPath`      | `string`   | **required**                  | Path to output `.d.ts` file                       |
| `envFiles`        | `string[]` | `['.env', '.env.example']`    | List of `.env` files to watch (in priority order) |
| `generatorScript` | `string`   | `'dist/EnvTypesGenerator.js'` | Path to custom generator script                   |
| `silent`          | `boolean`  | `false`                       | Disable console logs                              |

#### Shorthand

You can pass a string directly as a shorthand for `outputPath`:

```javascript
new EnvTypesPlugin('src/types/env.d.ts');
// Equivalent to:
new EnvTypesPlugin({ outputPath: 'src/types/env.d.ts' });
```

## How It Works

1. **On Initial Build**: The plugin generates TypeScript definitions from your `.env` files
2. **On `.env` Changes**: When you modify `.env` files in watch mode, types are regenerated
3. **Webpack Exclusion**: The generated `.d.ts` file is automatically excluded from webpack's file watching to prevent rebuild loops
4. **Comment Extraction**: Comments above or inline with environment variables become JSDoc comments in the generated types

## TypeScript Configuration

Make sure your `tsconfig.json` includes the generated types:

```json
{
  "compilerOptions": {
    "typeRoots": ["./node_modules/@types", "./src/types"]
  },
  "include": ["src/**/*"]
}
```

## Requirements

- Node.js >= 14.0.0
- Webpack >= 5.0.0

## License

MIT © [Your Name]

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Issues

If you find a bug or have a feature request, please open an issue on [GitHub](https://github.com/XXanderWP/EnvTypesWebpack/issues).
