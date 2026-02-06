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
  /** Optional namespace for the generated types
   * @default "NodeJS"
   */
  namespace?: string;
  /** Optional interface name for the generated types
   * @default "ProcessEnv"
   */
  interface?: string;
  /** Use values as types instead of string literals
   * @default false
   * If true, the generated types will use the actual values from the .env files as types instead of string literals. For example, if you have a variable `API_URL=http://localhost:3000`, the generated type will be `API_URL: "http://localhost:3000"` instead of `API_URL: string`.
   */
  useValuesAsTypes?: boolean;
}
