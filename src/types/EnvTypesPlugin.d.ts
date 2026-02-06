import { EnvTypesGeneratorOptions } from './EnvTypesGenerator';

/**
 * Configuration options for EnvTypesPlugin
 */
export interface EnvTypesPluginOptions extends EnvTypesGeneratorOptions {
  /**
   * Path to generator script
   * @default 'node_modules/env-types-webpack-plugin/dist/EnvTypesGenerator.js'
   */
  generatorScript?: string;
}
