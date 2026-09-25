const { execSync } = require('child_process');

console.log('🔍 Scanning full git commit history for secrets...');

const diffHistory = execSync('git log --all -p', { maxBuffer: 1024 * 1024 * 100, encoding: 'utf8' });

const patterns = [
  { name: 'Private Key', regex: /-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----/ },
  { name: 'MongoDB URI with Password', regex: /mongodb(\+srv)?:\/\/[a-zA-Z0-9_-]+:[a-zA-Z0-9_!@#$%^&*()+-]+@/i },
  { name: 'JWT Secret Hardcoded', regex: /JWT_SECRET\s*=\s*['"]?[a-zA-Z0-9_\-]{20,}['"]?/i },
  { name: 'Generic API Key / Token', regex: /(api_key|apikey|secret_key|private_key|auth_token)\s*[:=]\s*['"][a-zA-Z0-9_\-\.]{20,}['"]/i },
  { name: 'Habib Metro / Kuickpay Secret', regex: /(HABIB_METRO_SECURE_KEY|KUICKPAY_API_KEY)\s*=\s*[a-zA-Z0-9_\-]{10,}/i }
];

const lines = diffHistory.split('\n');
let commit = 'HEAD';
let findings = [];

lines.forEach((line, idx) => {
  if (line.startsWith('commit ')) {
    commit = line.split(' ')[1];
  }
  // Only check added lines (+) to find committed secrets
  if (line.startsWith('+') && !line.startsWith('+++')) {
    // Ignore example / test / placeholder lines
    const isPlaceholder = line.includes('REPLACE_WITH') || 
                          line.includes('PENDING_FROM_BANK') || 
                          line.includes('your_') || 
                          line.includes('<user>') ||
                          line.includes('test_secret_key') ||
                          line.includes('.env.example');
    if (!isPlaceholder) {
      for (const p of patterns) {
        if (p.regex.test(line)) {
          findings.push({ commit, pattern: p.name, line: line.trim() });
        }
      }
    }
  }
});

console.log(`\nScan complete across entire git commit history.`);
if (findings.length === 0) {
  console.log('✅ ZERO secrets or active credentials found in git history.');
} else {
  console.log(`⚠️ Found ${findings.length} possible secrets in historical commits:`);
  findings.forEach(f => console.log(`  Commit ${f.commit.substring(0, 8)}: [${f.pattern}] ${f.line}`));
}
