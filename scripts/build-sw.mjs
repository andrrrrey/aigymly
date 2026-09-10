// Stamps a unique BUILD_ID into public/sw.js so that every production build
// ships a byte-different service worker. Run before `next build`.
//
// Without this, sw.js is identical across deploys, the browser never sees a
// new worker, the old cache is never purged, and installed PWAs keep running
// a stale client bundle (which is how clients ended up POSTing Server Action
// ids that no longer exist in the current build).
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const swPath = join(__dirname, '..', 'public', 'sw.js');

let sha = '';
try {
  sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
} catch {
  // Not a git checkout (or git unavailable) — the timestamp alone keeps the id unique.
}

// Timestamp guarantees uniqueness even when the same commit is redeployed.
const buildId = [sha, Date.now().toString(36)].filter(Boolean).join('-');

const source = readFileSync(swPath, 'utf8');
const stamped = source.replace(
  /const BUILD_ID = '[^']*';/,
  `const BUILD_ID = '${buildId}';`
);

if (stamped === source) {
  throw new Error('build-sw: could not find BUILD_ID placeholder in public/sw.js');
}

writeFileSync(swPath, stamped);
console.log(`[build-sw] stamped service worker BUILD_ID = ${buildId}`);
