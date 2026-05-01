import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, '..');
const distRoot = resolve(appRoot, 'dist');
const bundleRoot = resolve(distRoot, 'bundle');
const sourcePackagePath = resolve(appRoot, 'package.json');
const configExamplePath = resolve(appRoot, 'config.example.toml');
const readmePath = resolve(scriptDir, 'README.md');

function pruneBundleArtifacts(rootDir) {
  for (const entry of readdirSync(rootDir)) {
    const entryPath = resolve(rootDir, entry);
    const stats = statSync(entryPath);

    if (stats.isDirectory()) {
      pruneBundleArtifacts(entryPath);

      if (readdirSync(entryPath).length === 0) {
        rmSync(entryPath, { recursive: true, force: true });
      }
      continue;
    }

    if (
      entry.endsWith('.d.ts') ||
      entry.endsWith('.d.ts.map') ||
      entry.endsWith('.js.map')
    ) {
      rmSync(entryPath, { force: true });
    }
  }
}

rmSync(distRoot, { recursive: true, force: true });
mkdirSync(distRoot, { recursive: true });

const sourcePackage = JSON.parse(readFileSync(sourcePackagePath, 'utf8'));
const runtimeDependencies = Object.keys(sourcePackage.dependencies ?? {});
const externalArgs = runtimeDependencies.flatMap(dependency => ['-e', dependency]);
const nccBin = resolve(appRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'ncc.cmd' : 'ncc');
const nccResult = spawnSync(
  nccBin,
  ['build', 'src/main.ts', '-o', bundleRoot, ...externalArgs],
  {
    cwd: appRoot,
    stdio: 'inherit',
  }
);

if (nccResult.status !== 0) {
  process.exit(nccResult.status ?? 1);
}

pruneBundleArtifacts(bundleRoot);

const runtimePackage = {
  name: sourcePackage.name,
  version: sourcePackage.version ?? '0.0.0',
  private: true,
  type: 'module',
  main: './bundle/index.js',
  scripts: {
    start: 'node ./bundle/index.js',
  },
  dependencies: sourcePackage.dependencies ?? {},
};

writeFileSync(
  resolve(distRoot, 'package.json'),
  JSON.stringify(runtimePackage, null, 2) + '\n'
);

if (existsSync(configExamplePath)) {
  copyFileSync(configExamplePath, resolve(distRoot, 'config.toml'));
}

if (existsSync(readmePath)) {
  copyFileSync(readmePath, resolve(distRoot, 'README.md'));
}
