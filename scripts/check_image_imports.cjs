const fs = require('fs');
const path = require('path');
const ignore = new Set(['.git', 'node_modules', '.next']);

const missing = [];

function check(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignore.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) check(full);
    else if (/\.(jsx|tsx|js)$/.test(entry.name)) {
      const src = fs.readFileSync(full, 'utf8');
      if (/<Image\b/.test(src)) {
        if (!/import\s+Image\s+from\s+['"]next\/image['"]/.test(src)) {
          missing.push(full);
        }
      }
    }
  }
}

check(path.join(__dirname, '../apps/web/app'));
check(path.join(__dirname, '../apps/web/components'));

console.log('Files missing Image import:', missing);
