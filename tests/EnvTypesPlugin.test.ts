import * as fs from 'fs';
import * as path from 'path';
import { EnvTypesPlugin } from '../src/EnvTypesPlugin';
import type { Compiler } from 'webpack';

describe('EnvTypesPlugin', () => {
  describe('constructor', () => {
    it('should accept string as outputPath', () => {
      const plugin = new EnvTypesPlugin('src/types/env.d.ts');
      expect(plugin).toBeInstanceOf(EnvTypesPlugin);
    });

    it('should accept options object', () => {
      const plugin = new EnvTypesPlugin({
        outputPath: 'src/types/env.d.ts',
        envFiles: ['.env'],
        silent: true,
      });
      expect(plugin).toBeInstanceOf(EnvTypesPlugin);
    });

    it('should throw error if outputPath is missing', () => {
      expect(() => new EnvTypesPlugin({} as any)).toThrow(
        'outputPath is required'
      );
    });

    it('should use default options', () => {
      const plugin = new EnvTypesPlugin('output.d.ts');
      expect(plugin).toBeInstanceOf(EnvTypesPlugin);
    });

    it('should create output directory on construction', () => {
      const testDir = path.join(__dirname, '.tmp-plugin');
      const outputPath = path.join(testDir, 'types', 'env.d.ts');

      // Ensure directory doesn't exist
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }

      // Create plugin
      const plugin = new EnvTypesPlugin(outputPath);

      // Check directory was created
      expect(fs.existsSync(path.dirname(outputPath))).toBe(true);

      // Cleanup
      fs.rmSync(testDir, { recursive: true, force: true });
    });
  });

  describe('apply', () => {
    it('should register webpack hooks', () => {
      const plugin = new EnvTypesPlugin('output.d.ts');

      const mockCompiler = {
        options: {
          watchOptions: {},
        },
        context: process.cwd(),
        hooks: {
          beforeCompile: {
            tapAsync: jest.fn(),
          },
          watchRun: {
            tap: jest.fn(),
          },
          thisCompilation: {
            tap: jest.fn(),
          },
          afterCompile: {
            tap: jest.fn(),
          },
        },
      } as unknown as Compiler;

      plugin.apply(mockCompiler);

      expect(mockCompiler.hooks.beforeCompile.tapAsync).toHaveBeenCalledWith(
        'EnvTypesPlugin',
        expect.any(Function)
      );
      expect(mockCompiler.hooks.watchRun.tap).toHaveBeenCalledWith(
        'EnvTypesPlugin',
        expect.any(Function)
      );
      expect(mockCompiler.hooks.thisCompilation.tap).toHaveBeenCalledWith(
        'EnvTypesPlugin',
        expect.any(Function)
      );
      expect(mockCompiler.hooks.afterCompile.tap).toHaveBeenCalledWith(
        'EnvTypesPlugin',
        expect.any(Function)
      );
    });

    it('should add output file to watchOptions.ignored', () => {
      const plugin = new EnvTypesPlugin('output.d.ts');
      const outputAbsPath = path.resolve('output.d.ts');

      const mockCompiler = {
        options: {
          watchOptions: {},
        },
        context: process.cwd(),
        hooks: {
          beforeCompile: { tapAsync: jest.fn() },
          watchRun: { tap: jest.fn() },
          thisCompilation: { tap: jest.fn() },
          afterCompile: { tap: jest.fn() },
        },
      } as unknown as Compiler;

      plugin.apply(mockCompiler);

      expect(mockCompiler.options.watchOptions?.ignored).toContain(
        outputAbsPath
      );
    });

    it('should preserve existing ignored patterns', () => {
      const plugin = new EnvTypesPlugin('output.d.ts');
      const existingIgnored = ['node_modules/**', '*.test.ts'];

      const mockCompiler = {
        options: {
          watchOptions: {
            ignored: existingIgnored,
          },
        },
        context: process.cwd(),
        hooks: {
          beforeCompile: { tapAsync: jest.fn() },
          watchRun: { tap: jest.fn() },
          thisCompilation: { tap: jest.fn() },
          afterCompile: { tap: jest.fn() },
        },
      } as unknown as Compiler;

      plugin.apply(mockCompiler);

      const ignored = mockCompiler.options.watchOptions?.ignored as string[];
      expect(ignored).toContain('node_modules/**');
      expect(ignored).toContain('*.test.ts');
      expect(ignored).toContain(path.resolve('output.d.ts'));
    });
  });

  describe('options validation', () => {
    it('should accept custom envFiles', () => {
      const plugin = new EnvTypesPlugin({
        outputPath: 'output.d.ts',
        envFiles: ['.env.local', '.env.production'],
      });
      expect(plugin).toBeInstanceOf(EnvTypesPlugin);
    });

    it('should accept silent option', () => {
      const plugin = new EnvTypesPlugin({
        outputPath: 'output.d.ts',
        silent: true,
      });
      expect(plugin).toBeInstanceOf(EnvTypesPlugin);
    });

    it('should accept custom generatorScript', () => {
      const plugin = new EnvTypesPlugin({
        outputPath: 'output.d.ts',
        generatorScript: 'custom-generator.js',
      });
      expect(plugin).toBeInstanceOf(EnvTypesPlugin);
    });
  });
});
