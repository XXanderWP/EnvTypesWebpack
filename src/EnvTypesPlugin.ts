import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type { Compiler, Compilation } from 'webpack';
import webpack from 'webpack';

/**
 * Configuration options for EnvTypesPlugin
 */
export interface EnvTypesPluginOptions {
  /**
   * List of .env files to watch (in priority order)
   * @default ['.env', '.env.example']
   */
  envFiles?: string[];

  /**
   * Path to output .d.ts file (required)
   * @example 'src/types/env.d.ts'
   */
  outputPath: string;

  /**
   * Path to generator script
   * @default 'node_modules/env-types-webpack-plugin/dist/EnvTypesGenerator.js'
   */
  generatorScript?: string;

  /**
   * Disable console logs
   * @default false
   */
  silent?: boolean;
}

/**
 * Webpack plugin that automatically generates TypeScript definitions
 * for environment variables from .env files
 *
 * @example
 * // Simple usage with string
 * new EnvTypesPlugin('src/types/env.d.ts')
 *
 * @example
 * // Advanced usage with options
 * new EnvTypesPlugin({
 *   outputPath: 'src/types/env.d.ts',
 *   envFiles: ['.env.local', '.env'],
 *   silent: false
 * })
 */
export class EnvTypesPlugin {
  private readonly options: Required<EnvTypesPluginOptions>;
  private readonly outputAbsolutePath: string;

  /**
   * Creates an instance of EnvTypesPlugin
   * @param options - Plugin configuration or path to output .d.ts file
   */
  constructor(options: EnvTypesPluginOptions | string) {
    // Handle string shorthand
    if (typeof options === 'string') {
      options = { outputPath: options };
    }

    // Validate required outputPath
    if (!options || !options.outputPath) {
      throw new Error(
        '[EnvTypesPlugin] outputPath is required. ' +
          'Usage: new EnvTypesPlugin("path/to/env.d.ts") or new EnvTypesPlugin({ outputPath: "..." })'
      );
    }

    // Default generator script points to bundled version
    const defaultGeneratorScript = path.resolve(
      __dirname,
      'EnvTypesGenerator.js'
    );

    this.options = {
      envFiles: options.envFiles || ['.env', '.env.example'],
      outputPath: options.outputPath,
      generatorScript: options.generatorScript || defaultGeneratorScript,
      silent: options.silent || false,
    };

    this.outputAbsolutePath = path.resolve(this.options.outputPath);
    this.ensureOutputDirectory();
  }

  /**
   * Creates output directory if it doesn't exist
   */
  private ensureOutputDirectory(): void {
    const outputDir = path.dirname(this.outputAbsolutePath);

    if (!fs.existsSync(outputDir)) {
      try {
        fs.mkdirSync(outputDir, { recursive: true });
        if (!this.options.silent) {
          console.log(`[EnvTypesPlugin] Created directory: ${outputDir}`);
        }
      } catch (error) {
        throw new Error(
          `[EnvTypesPlugin] Failed to create output directory: ${outputDir}\n${
            (error as Error).message
          }`
        );
      }
    }
  }

  /**
   * Generates environment types by executing the generator script
   */
  private generateTypes(): void {
    try {
      this.ensureOutputDirectory();

      const env = {
        ENV_FILES: this.options.envFiles.join(','),
        OUTPUT_PATH: this.options.outputPath,
      };

      execSync(`node ${this.options.generatorScript}`, {
        stdio: this.options.silent ? 'pipe' : 'inherit',
        env: { ...process.env, ...env },
      });
    } catch (error) {
      console.error(
        '[EnvTypesPlugin] Failed to generate env types:',
        (error as Error).message
      );
    }
  }

  /**
   * Checks if any .env file has changed
   */
  private hasEnvFileChanged(changedFiles: ReadonlySet<string>): boolean {
    return [...changedFiles].some(file =>
      this.options.envFiles.some(envFile => file.endsWith(envFile))
    );
  }

  /**
   * Adds .env files to compilation dependencies for watching
   */
  private addFileDependencies(
    compilation: Compilation,
    contextPath: string
  ): void {
    this.options.envFiles.forEach(file => {
      const fullPath = path.resolve(contextPath, file);
      if (fs.existsSync(fullPath)) {
        compilation.fileDependencies.add(fullPath);
      }
    });
  }

  /**
   * Excludes generated .d.ts file from webpack watching
   */
  private excludeFromWatch(compilation: Compilation): void {
    if (fs.existsSync(this.outputAbsolutePath)) {
      compilation.fileDependencies.delete(this.outputAbsolutePath);
    }
  }

  /**
   * Applies the plugin to webpack compiler
   */
  apply(compiler: Compiler): void {
    const pluginName = 'EnvTypesPlugin';

    // Add ignore pattern to webpack's watch options
    const originalWatchOptions = compiler.options.watchOptions || {};
    const existingIgnored = originalWatchOptions.ignored;

    const ignoredArray: Array<string | RegExp> = [];
    if (Array.isArray(existingIgnored)) {
      ignoredArray.push(...existingIgnored);
    } else if (existingIgnored) {
      ignoredArray.push(existingIgnored);
    }
    ignoredArray.push(this.outputAbsolutePath);

    compiler.options.watchOptions = {
      ...originalWatchOptions,
      ignored: ignoredArray as any,
    };

    // Generate on initial build
    compiler.hooks.beforeCompile.tapAsync(pluginName, (params, callback) => {
      this.generateTypes();
      callback();
    });

    // Generate when .env changes in watch mode
    compiler.hooks.watchRun.tap(pluginName, compiler => {
      const changedFiles = compiler.modifiedFiles;
      if (changedFiles && this.hasEnvFileChanged(changedFiles)) {
        this.generateTypes();
      }
    });

    // Track .env files and exclude generated .d.ts
    compiler.hooks.thisCompilation.tap(pluginName, compilation => {
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          this.addFileDependencies(compilation, compiler.context);
          this.excludeFromWatch(compilation);
        }
      );
    });

    // Additional safety: exclude on after compile
    compiler.hooks.afterCompile.tap(pluginName, compilation => {
      this.excludeFromWatch(compilation);
    });
  }
}

export default EnvTypesPlugin;
