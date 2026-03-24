import { fileURLToPath } from 'node:url';
import { dirname, resolve, sep } from 'node:path';

// Get current directory in ESM (Bundlers like ncc will replace this with __dirname in CJS builds)
const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = dirname(currentFilename);

export function getProjectRoot(): string {
    // When running from source, resolve the workspace package root.
    if (currentDirname.includes(`${sep}src${sep}`)) {
        return resolve(currentDirname, '../..');
    }

    // When running from a deployed bundle, treat the current working directory
    // as the package root so config.toml, storage, and session data live beside package.json.
    return process.cwd();
}
