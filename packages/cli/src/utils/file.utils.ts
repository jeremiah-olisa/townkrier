import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure directory exists
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

/**
 * Write file with content
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.writeFile(filePath, content, 'utf8');
}

/**
 * Convert PascalCase to kebab-case
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Convert kebab-case or snake_case to PascalCase
 */
export function toPascalCase(str: string): string {
  // Handle already PascalCase strings
  if (/^[A-Z][a-zA-Z0-9]*$/.test(str)) {
    return str;
  }

  // Handle camelCase or kebab-case or snake_case
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
    .replace(/^(.)/, (char) => char.toUpperCase());
}

/**
 * Get the project root directory
 */
export function getProjectRoot(): string {
  let currentDir = process.cwd();

  // Try to find package.json with townkrier workspace
  while (currentDir !== path.parse(currentDir).root) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = fs.readJSONSync(packageJsonPath);
      if (packageJson.name === 'townkrier-monorepo' || packageJson.workspaces) {
        return currentDir;
      }
    }
    currentDir = path.dirname(currentDir);
  }

  // Fallback to current directory
  return process.cwd();
}

/**
 * Get default notifications directory
 */
export function getNotificationsDir(): string {
  const projectRoot = getProjectRoot();

  // Check if we're in a project with src/notifications
  const srcNotificationsDir = path.join(projectRoot, 'src', 'notifications');
  if (fs.existsSync(path.join(projectRoot, 'src'))) {
    return srcNotificationsDir;
  }

  // Check if we're in examples directory
  const examplesDir = path.join(projectRoot, 'examples', 'notifications');
  if (fs.existsSync(path.join(projectRoot, 'examples'))) {
    return examplesDir;
  }

  // Default to notifications directory in current location
  return path.join(projectRoot, 'notifications');
}
