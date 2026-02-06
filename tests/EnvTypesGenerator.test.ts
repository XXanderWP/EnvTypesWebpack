import * as fs from 'fs';
import * as path from 'path';
import { EnvTypesGenerator } from '../src/EnvTypesGenerator';

describe('EnvTypesGenerator', () => {
  const testDir = path.join(__dirname, '.tmp');
  const envFile = path.join(testDir, '.env');
  const outputFile = path.join(testDir, 'env.d.ts');

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should create instance with valid options', () => {
      const generator = new EnvTypesGenerator({
        silent: true,
        envFiles: ['.env'],
        outputPath: 'test.d.ts',
      });

      expect(generator).toBeInstanceOf(EnvTypesGenerator);
    });
  });

  describe('generate', () => {
    it('should generate types from simple .env file', () => {
      // Arrange
      const envContent = `
DB_HOST=localhost
DB_PORT=5432
API_KEY=secret
`.trim();

      fs.writeFileSync(envFile, envContent);

      const generator = new EnvTypesGenerator({
        silent: true,
        envFiles: [envFile],
        outputPath: outputFile,
      });

      // Act
      generator.generate();

      // Assert
      expect(fs.existsSync(outputFile)).toBe(true);

      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).toContain('DB_HOST?: string;');
      expect(content).toContain('DB_PORT?: string;');
      expect(content).toContain('API_KEY?: string;');
      expect(content).toContain('declare namespace NodeJS');
      expect(content).toContain('interface ProcessEnv');
    });

    it('should preserve comments as JSDoc', () => {
      // Arrange
      const envContent = `
# Database host
DB_HOST=localhost

# Database port
DB_PORT=5432
`.trim();

      fs.writeFileSync(envFile, envContent);

      const generator = new EnvTypesGenerator({
        silent: true,
        envFiles: [envFile],
        outputPath: outputFile,
      });

      // Act
      generator.generate();

      // Assert
      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).toContain('/**');
      expect(content).toContain('* Database host');
      expect(content).toContain('* Database port');
      expect(content).toContain('*/');
    });

    it('should handle inline comments', () => {
      // Arrange
      const envContent = 'API_KEY=secret # Production key';

      fs.writeFileSync(envFile, envContent);

      const generator = new EnvTypesGenerator({
        silent: true,
        envFiles: [envFile],
        outputPath: outputFile,
      });

      // Act
      generator.generate();

      // Assert
      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).toContain('Production key');
      expect(content).toContain('API_KEY?: string;');
    });

    it('should handle export prefix', () => {
      // Arrange
      const envContent = 'export NODE_ENV=production';

      fs.writeFileSync(envFile, envContent);

      const generator = new EnvTypesGenerator({
        silent: true,
        envFiles: [envFile],
        outputPath: outputFile,
      });

      // Act
      generator.generate();

      // Assert
      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).toContain('NODE_ENV?: string;');
    });

    it('should skip empty lines and pure comments', () => {
      // Arrange
      const envContent = `
# This is a comment

DB_HOST=localhost

# Another comment
`.trim();

      fs.writeFileSync(envFile, envContent);

      const generator = new EnvTypesGenerator({
        silent: true,
        envFiles: [envFile],
        outputPath: outputFile,
      });

      // Act
      generator.generate();

      // Assert
      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).toContain('DB_HOST?: string;');
      expect(content.match(/DB_HOST/g)?.length).toBe(1);
    });

    it('should skip write if content unchanged', () => {
      // Arrange
      const envContent = 'DB_HOST=localhost';
      fs.writeFileSync(envFile, envContent);

      const generator = new EnvTypesGenerator({
        envFiles: [envFile],
        outputPath: outputFile,
      });

      // Generate first time
      generator.generate();
      const firstContent = fs.readFileSync(outputFile, 'utf-8');

      // Mock console.log to capture output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act - generate second time with same content
      generator.generate();

      // Assert - should log "up to date" message
      expect(consoleSpy).toHaveBeenCalledWith(
        '[env-types] Types are up to date, skipping write'
      );

      // Content should still be the same
      const secondContent = fs.readFileSync(outputFile, 'utf-8');
      expect(secondContent).toBe(firstContent);

      consoleSpy.mockRestore();
    });

    it('should create output directory if not exists', () => {
      // Arrange
      const nestedOutput = path.join(testDir, 'nested', 'deep', 'env.d.ts');
      fs.writeFileSync(envFile, 'DB_HOST=localhost');

      const generator = new EnvTypesGenerator({
        silent: true,
        envFiles: [envFile],
        outputPath: nestedOutput,
      });

      // Act
      generator.generate();

      // Assert
      expect(fs.existsSync(nestedOutput)).toBe(true);
    });

    it('should throw error if no env file found', () => {
      // Arrange
      const generator = new EnvTypesGenerator({
        silent: true,
        envFiles: ['.env.nonexistent'],
        outputPath: outputFile,
      });

      // Act & Assert
      expect(() => generator.generate()).toThrow('No env files found');
    });

    it('should use first found env file from list', () => {
      // Arrange
      const env1 = path.join(testDir, '.env.local');
      const env2 = path.join(testDir, '.env');

      fs.writeFileSync(env1, 'LOCAL_VAR=local');
      fs.writeFileSync(env2, 'PROD_VAR=prod');

      const generator = new EnvTypesGenerator({
        silent: true,
        envFiles: [env1, env2],
        outputPath: outputFile,
      });

      // Act
      generator.generate();

      // Assert
      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).toContain('LOCAL_VAR?: string;');
      expect(content).not.toContain('PROD_VAR?: string;');
    });

    it('should handle multiline comments', () => {
      // Arrange
      const envContent = `
# Line 1 of comment
# Line 2 of comment
# Line 3 of comment
DB_HOST=localhost
`.trim();

      fs.writeFileSync(envFile, envContent);

      const generator = new EnvTypesGenerator({
        envFiles: [envFile],
        outputPath: outputFile,
      });

      // Act
      generator.generate();

      // Assert
      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).toContain('Line 1 of comment');
      expect(content).toContain('Line 2 of comment');
      expect(content).toContain('Line 3 of comment');
    });

    it('should handle useValuesAsTypes option', () => {
      // Arrange
      const envContent = `
DB_HOST=localhost
`.trim();

      fs.writeFileSync(envFile, envContent);

      const generator = new EnvTypesGenerator({
        silent: true,
        envFiles: [envFile],
        outputPath: outputFile,
        useValuesAsTypes: true,
      });

      // Act
      generator.generate();

      // Assert
      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).toContain('DB_HOST');
      expect(content).toContain('"localhost"');
    });

    it('should handle values with equals signs', () => {
      // Arrange
      const envContent = 'CONNECTION_STRING=host=localhost;port=5432';

      fs.writeFileSync(envFile, envContent);

      const generator = new EnvTypesGenerator({
        silent: true,
        envFiles: [envFile],
        outputPath: outputFile,
      });

      // Act
      generator.generate();

      // Assert
      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).toContain('CONNECTION_STRING?: string;');
    });

    it('should include generation timestamp', () => {
      // Arrange
      fs.writeFileSync(envFile, 'DB_HOST=localhost');

      const generator = new EnvTypesGenerator({
        silent: true,
        envFiles: [envFile],
        outputPath: outputFile,
      });

      // Act
      generator.generate();

      // Assert
      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).toMatch(/Generated: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include source file reference', () => {
      // Arrange
      fs.writeFileSync(envFile, 'DB_HOST=localhost');

      const generator = new EnvTypesGenerator({
        silent: true,
        envFiles: [envFile],
        outputPath: outputFile,
      });

      // Act
      generator.generate();

      // Assert
      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).toContain(`Source: ${envFile}`);
    });
  });
});
