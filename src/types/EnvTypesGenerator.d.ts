/**
 * Configuration options for EnvTypesGenerator
 */
export interface EnvTypesGeneratorOptions {
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
   * Disable console logs
   * @default false
   */
  silent?: boolean;

  /** Disable partial types
   * @default false
   */
  disablePartialType?: boolean;

  /** Add `export {};` at end
   * @default false
   */
  addExportEnds?: boolean;
}
