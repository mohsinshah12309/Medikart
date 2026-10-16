const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const ignoreDirs = new Set(['.git', 'node_modules', '.next', 'dist', 'build', '.gemini']);

const results = [];

function searchDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchDir(fullPath);
    } else if (entry.isFile() && /\.(js|jsx|ts|tsx|json|html|md|env.*)$/.test(entry.name)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        // Search for patterns like 0300, 0341113, wa.me, tel:, etc.
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (
            /03\d{2}[-\s]?\d{7}/.test(line) ||
            /92\d{10}/.test(line) ||
            /wa\.me/.test(line) ||
            /tel:\+?92/.test(line) ||
            /0300\s?0341113/.test(line) ||
            /03000341113/.test(line)
          ) {
            // Exclude validation regex like /^((\+92|0)?3[0-9]{9})$/
            if (!line.includes('[0-9]{9}') && !line.includes('03001234567')) {
              results.push({
                file: path.relative(rootDir, fullPath),
                line: idx + 1,
                text: line.trim()
              });
            }
          }
        });
      } catch (e) {}
    }
  }
}

searchDir(rootDir);
console.log(`Found ${results.length} occurrences:`);
results.forEach(r => console.log(`${r.file}:${r.line}: ${r.text}`));
