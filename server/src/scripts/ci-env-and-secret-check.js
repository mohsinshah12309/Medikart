/**
 * CI/CD Environment, Secret & Hardcoded URL Scanner
 * Medikart Production Readiness Guard
 */

const fs = require('fs');
const path = require('path');

let errors = [];
let warnings = [];

console.log('🔍 [CI Stage 5] Running Environment & Configuration Validation...\n');

// 1. Validate server/.env.example against critical production variables
const criticalVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'KUICKPAY_BASE_URL',
  'KUICKPAY_MERCHANT_ID',
  'KUICKPAY_API_KEY',
  'GOOGLE_SHEETS_CLIENT_EMAIL',
  'GOOGLE_SHEETS_PRIVATE_KEY',
  'GOOGLE_SHEETS_SHEET_ID',
  'GROQ_API_KEY',
];

const envExamplePath = path.resolve(__dirname, '../../../server/.env.example');
if (fs.existsSync(envExamplePath)) {
  const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
  for (const v of criticalVars) {
    if (!envExampleContent.includes(v + '=')) {
      errors.push(`[ENV] server/.env.example is missing critical required variable: ${v}`);
    }
  }
} else {
  errors.push('[ENV] server/.env.example file not found');
}

// 2. Check for sensitive NEXT_PUBLIC_ variables
const disallowedKeywords = ['SECRET', 'PASSWORD', 'PRIVATE_KEY', 'JWT'];
function scanForLeakedPublicKeys(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== 'dist') {
        scanForLeakedPublicKeys(fullPath);
      }
    } else if (entry.name.startsWith('.env') || entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(/NEXT_PUBLIC_[A-Z0-9_]+/g) || [];
      for (const m of matches) {
        for (const kw of disallowedKeywords) {
          if (m.toUpperCase().includes(kw)) {
            errors.push(`[SECRET LEAK RISK] Potentially sensitive key exposed with NEXT_PUBLIC_ in ${fullPath}: ${m}`);
          }
        }
      }
    }
  }
}

scanForLeakedPublicKeys(path.resolve(__dirname, '../../../apps/web'));
scanForLeakedPublicKeys(path.resolve(__dirname, '../../../apps/admin'));

// 3. Scan for hardcoded localhost in frontend source files
function scanHardcodedUrls(dir, relativeRoot) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== 'dist' && entry.name !== 'tests') {
        scanHardcodedUrls(fullPath, relativeRoot);
      }
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        // Exclude commented lines or fallback strings in config files
        if (line.includes('http://localhost') || line.includes('http://127.0.0.1')) {
          if (!line.trim().startsWith('//') && !line.includes('process.env.') && !entry.name.includes('.example')) {
            warnings.push(`[HARDCODED URL] Possible dev URL at ${path.relative(relativeRoot, fullPath)}:${index + 1}: ${line.trim()}`);
          }
        }
      });
    }
  }
}

const rootDir = path.resolve(__dirname, '../../../');
scanHardcodedUrls(path.resolve(rootDir, 'apps/web/app'), rootDir);
scanHardcodedUrls(path.resolve(rootDir, 'apps/web/components'), rootDir);
scanHardcodedUrls(path.resolve(rootDir, 'apps/admin/src'), rootDir);

// Report Results
console.log('--- CI ENVIRONMENT & CONFIGURATION REPORT ---');
if (errors.length === 0) {
  console.log('✅ Environment variable documentation and secret checks passed.');
} else {
  console.error(`❌ Found ${errors.length} configuration error(s):`);
  errors.forEach(e => console.error('  - ' + e));
}

if (warnings.length > 0) {
  console.log(`⚠️ Found ${warnings.length} warning(s):`);
  warnings.forEach(w => console.log('  - ' + w));
} else {
  console.log('✅ No hardcoded localhost/dev URLs found in frontend client components.');
}

if (errors.length > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
