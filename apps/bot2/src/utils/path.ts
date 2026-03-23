import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Get current directory in ESM (Bundlers like ncc will replace this with __dirname in CJS builds)
const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = dirname(currentFilename);

export function getProjectRoot(): string {
    // In production, only the dist/ folder is deployed.
    // So if the code is bundled via ncc (flattened into dist/main.js),
    // the root for config.toml, storage, etc., is the dist folder itself.
    if (currentDirname.endsWith('dist')) {
        return currentDirname;
    }
    // If running in development source via tsx (apps/bot2/src/utils/path.ts),
    // the root is two levels up relative to this file.
    return resolve(currentDirname, '../..');
}
