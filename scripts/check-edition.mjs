import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
assert.equal(JSON.parse(readFileSync('EDITION.json')).edition, 'public');
assert.equal(JSON.parse(readFileSync('package.json')).dependencies['html-to-image'], undefined);
function scan(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scan(file);
      continue;
    }
    if (!/\.tsx?$/.test(file) || /\.test\./.test(file)) {
      continue;
    }
    const source = readFileSync(file, 'utf8');
    assert(
      !/html-to-image|getPanelScreenshotService|discoverCapturePanels|captureDashboard|captureSelectedPanels|document\s*\.\s*(querySelector|body|documentElement|scrollingElement|getElement)/.test(
        source
      ),
      `Cross-panel capture code is forbidden in public edition: ${file}`
    );
  }
}
scan('src');
console.log('PUBLIC edition: no cross-panel capture implementation or dependency.');
