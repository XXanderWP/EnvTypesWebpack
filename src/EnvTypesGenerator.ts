import * as fs from 'fs';
import * as path from 'path';

/**
 * Represents a single environment variable entry
 */
export interface EnvEntry {
  /** Environment variable name */
  key: string;
  /** JSDoc comment describing the variable */
  comment: string | null;
}

/**
 * Configuration options for EnvTypesGenerator
 */
export interface EnvTypesGeneratorOptions {
  /** List of .env files to search (in priority order) */
  envFiles: string[];
  /** Path to output .d.ts file */
  outputPath: string;
  /** Disable partial types
   * @default false
   */
  disablePartialType?: boolean;
}

/**
 * Generates TypeScript definitions for environment variables from .env files
 *
 * @example
 * const generator = new EnvTypesGenerator({
 *   envFiles: ['.env', '.env.example'],
 *   outputPath: 'src/types/env.d.ts'
 * });
 * generator.generate();
 */
export class EnvTypesGenerator {
  private readonly envFiles: string[];
  private readonly outputPath: string;
  private readonly disablePartialType: boolean;

  constructor(options: EnvTypesGeneratorOptions) {
    this.envFiles = options.envFiles;
    this.outputPath = path.resolve(process.cwd(), options.outputPath);
    this.disablePartialType = options.disablePartialType ?? false;
  }

  /**
   * Finds first existing .env file from the list
   */
  private findEnvFile(): string {
    for (const file of this.envFiles) {
      if (fs.existsSync(file)) {
        return file;
      }
    }
    throw new Error(
      `No env files found. Searched: ${this.envFiles.join(', ')}`
    );
  }

  /**
   * Parses .env file content and extracts variable definitions with comments
   */
  private parseEnvFile(content: string): EnvEntry[] {
    const lines = content.split('\n');
    const entries: EnvEntry[] = [];
    let commentBuffer: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();

      // Empty line - reset comment buffer
      if (!line) {
        commentBuffer = [];
        continue;
      }

      // Comment line
      if (line.startsWith('#')) {
        commentBuffer.push(line.replace(/^#\s?/, ''));
        continue;
      }

      // Not a variable declaration
      if (!line.includes('=')) {
        commentBuffer = [];
        continue;
      }

      // Remove export prefix if present
      const cleaned = line.startsWith('export ') ? line.slice(7) : line;
      const [left, ...rest] = cleaned.split('=');
      const key = left.trim();

      // Check for inline comment
      const valuePart = rest.join('=');
      const hashIndex = valuePart.indexOf('#');
      const inlineComment =
        hashIndex !== -1 ? valuePart.slice(hashIndex + 1).trim() : null;

      const comments = [
        ...commentBuffer,
        ...(inlineComment ? [inlineComment] : []),
      ];

      entries.push({
        key,
        comment: comments.length ? comments.join('\n') : null,
      });

      commentBuffer = [];
    }

    return entries;
  }

  /**
   * Generates JSDoc comment block
   */
  private generateJSDoc(comment: string): string {
    const lines = comment
      .split('\n')
      .map(line => `     * ${line}`)
      .join('\n');

    return `    /**\n${lines}\n     */`;
  }

  /**
   * Generates ProcessEnv interface body with all variables
   */
  private generateInterfaceBody(entries: EnvEntry[]): string {
    return entries
      .map(({ key, comment }) => {
        if (!comment) {
          return `    ${key}${this.disablePartialType ? '' : '?'}: string;`;
        }

        const jsdoc = this.generateJSDoc(comment);
        return `${jsdoc}\n    ${key}${this.disablePartialType ? '' : '?'}: string;`;
      })
      .join('\n');
  }

  private generateContent(): string {
    const now = new Date();

    // Форматируем с ведущими нулями
    const pad = (n: number) => n.toString().padStart(2, '0');

    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1); // месяцы с 0
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    return `Generated: ${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  /**
   * Generates complete .d.ts file content
   */
  private generateDTS(entries: EnvEntry[], sourceFile: string): string {
    const body = this.generateInterfaceBody(entries);

    return `// ⚠️ AUTO-GENERATED FILE — DO NOT EDIT
// Source: ${sourceFile}
// ${this.generateContent()}

declare namespace NodeJS {
  interface ProcessEnv {
${body}
  }
}

export {};
`;
  }

  /**
   * Checks if file needs to be updated by comparing content (excluding timestamp)
   */
  private shouldUpdate(newContent: string): boolean {
    if (!fs.existsSync(this.outputPath)) {
      return true;
    }

    const currentContent = fs.readFileSync(this.outputPath, 'utf-8');

    // Compare content without timestamp lines
    const stripMetadata = (content: string) => {
      return content
        .split('\n')
        .filter(line => !line.startsWith('// Generated:'))
        .join('\n');
    };

    return stripMetadata(currentContent) !== stripMetadata(newContent);
  }

  /**
   * Ensures output directory exists, creates it if necessary
   */
  private ensureOutputDirectory(): void {
    const dir = path.dirname(this.outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[env-types] Created directory: ${dir}`);
    }
  }

  /**
   * Main generation method - reads .env, parses it, and writes .d.ts file
   */
  generate(): void {
    const envFile = this.findEnvFile();
    const content = fs.readFileSync(envFile, 'utf-8');
    const entries = this.parseEnvFile(content);
    const dts = this.generateDTS(entries, envFile);

    if (!this.shouldUpdate(dts)) {
      console.log('[env-types] Types are up to date, skipping write');
      return;
    }

    this.ensureOutputDirectory();
    fs.writeFileSync(this.outputPath, dts, 'utf-8');

    console.log(
      `[env-types] Generated ${entries.length} keys from ${envFile} → ${this.outputPath}`
    );
  }
}

// CLI mode support
if (require.main === module) {
  const envFiles = (process.env.ENV_FILES || '.env.example,.env').split(',');
  const outputPath = process.env.OUTPUT_PATH;

  if (!outputPath) {
    console.error(
      '[env-types] ERROR: OUTPUT_PATH environment variable is required'
    );
    process.exit(1);
  }

  const generator = new EnvTypesGenerator({ envFiles, outputPath });
  generator.generate();
}

export default EnvTypesGenerator;
