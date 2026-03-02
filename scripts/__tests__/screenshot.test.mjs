import { describe, it, expect } from 'vitest';
import { readFileSync, accessSync, constants, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptsDir = resolve(__dirname, '..');
const projectDir = resolve(scriptsDir, '..');

describe('screenshot infrastructure', () => {
  describe('scripts/screenshot.mjs', () => {
    it('exists and is non-empty', () => {
      const filePath = resolve(scriptsDir, 'screenshot.mjs');
      const stat = statSync(filePath);
      expect(stat.size).toBeGreaterThan(0);
    });

    it('has no syntax errors (parseable by Node.js)', () => {
      const filePath = resolve(scriptsDir, 'screenshot.mjs');
      // --check flag parses without executing
      expect(() => {
        execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
      }).not.toThrow();
    });
  });

  describe('scripts/visual-audit.sh', () => {
    it('exists and is non-empty', () => {
      const filePath = resolve(scriptsDir, 'visual-audit.sh');
      const stat = statSync(filePath);
      expect(stat.size).toBeGreaterThan(0);
    });

    it('is executable', () => {
      const filePath = resolve(scriptsDir, 'visual-audit.sh');
      expect(() => {
        accessSync(filePath, constants.X_OK);
      }).not.toThrow();
    });
  });

  describe('package.json', () => {
    it('contains screenshot script entry', () => {
      const pkgPath = resolve(projectDir, 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      expect(pkg.scripts.screenshot).toBe('bash scripts/visual-audit.sh');
    });

    it('contains screenshot:route script entry', () => {
      const pkgPath = resolve(projectDir, 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      expect(pkg.scripts['screenshot:route']).toBe('bash scripts/visual-audit.sh');
    });

    it('does not include puppeteer as a dependency', () => {
      const pkgPath = resolve(projectDir, 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      expect(pkg.dependencies?.puppeteer).toBeUndefined();
      expect(pkg.devDependencies?.puppeteer).toBeUndefined();
    });
  });
});
