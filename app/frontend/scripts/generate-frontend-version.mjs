import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJsonPath = resolve(root, 'package.json');
const outputPath = resolve(root, 'src/app/core/frontend-version.generated.ts');

const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
const version = packageJson.version;

if (typeof version !== 'string' || !/^\d+\.\d+\.\d+([-.+][0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error('package.json version is missing or invalid.');
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `export const FRONTEND_VERSION = ${JSON.stringify(version)};\n`,
  'utf8',
);
