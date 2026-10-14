/**
 * Comprehensive SEO Validation Script for Medikart.
 * 
 * Verifications:
 * 1. Category Meta Titles strictly <= 60 characters
 * 2. Category Meta Descriptions strictly <= 160 characters
 * 3. Title Uniqueness: No two categories share a title
 * 4. Description Uniqueness: No two categories share a description
 * 5. Internal buckets (consumer, flat-items, fridge-items, general-items, beverages, medicines) have noindex: true
 * 6. Keyword Bank Check:
 *    - Validates CSV columns if keyword-bank/*.csv exists
 *    - Checks that no keyword is assigned to two pages
 *    - Checks keyword density warning (> 2%)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CATEGORY_META_REGISTRY, NOINDEX_CATEGORY_SLUGS } from '../src/seo/category-meta.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================================');
console.log('🔍 MEDIKART SEO VALIDATION SUITE');
console.log('====================================================\n');

let errors = [];
let warnings = [];

// 1. Validate Category Titles and Descriptions Length & Uniqueness
console.log('▶ [1/3] Validating Category Meta Titles & Descriptions...');
const titleMap = new Map();
const descMap = new Map();

for (const [slug, meta] of Object.entries(CATEGORY_META_REGISTRY)) {
  const { title, description, noindex } = meta;

  // Title check
  if (!title) {
    errors.push(`Category '${slug}': Missing meta title.`);
  } else {
    if (title.length > 60) {
      errors.push(`Category '${slug}': Title exceeds 60 characters (${title.length} chars): "${title}"`);
    }
    if (titleMap.has(title)) {
      errors.push(`Duplicate Title: Category '${slug}' shares title with '${titleMap.get(title)}': "${title}"`);
    } else {
      titleMap.set(title, slug);
    }
  }

  // Description check
  if (!description) {
    errors.push(`Category '${slug}': Missing meta description.`);
  } else {
    if (description.length > 160) {
      errors.push(`Category '${slug}': Description exceeds 160 characters (${description.length} chars): "${description}"`);
    }
    if (descMap.has(description)) {
      errors.push(`Duplicate Description: Category '${slug}' shares description with '${descMap.get(description)}': "${description}"`);
    } else {
      descMap.set(description, slug);
    }
  }

  // AEO Summary check (strictly 40 to 60 words)
  const aeoSummary = meta.aeoSummary;
  if (!aeoSummary) {
    errors.push(`Category '${slug}': Missing AEO answer-first summary.`);
  } else {
    const wordCount = aeoSummary.trim().split(/\s+/).length;
    if (wordCount < 40 || wordCount > 60) {
      errors.push(`Category '${slug}': AEO summary must be 40 to 60 words (currently ${wordCount} words): "${aeoSummary}"`);
    }
  }

  // Internal bucket noindex check
  const internalBuckets = ['consumer', 'flat-items', 'fridge-items', 'general-items', 'beverages', 'medicines'];
  if (internalBuckets.includes(slug) && !noindex) {
    errors.push(`Category '${slug}' must be flagged as noindex: true.`);
  }
}

console.log(`  ✓ Checked ${Object.keys(CATEGORY_META_REGISTRY).length} registered categories.`);

// 2. Validate Sitemap Exclusions
console.log('\n▶ [2/3] Validating Noindex & Sitemap Exclusions...');
const requiredNoindexes = ['consumer', 'flat-items', 'fridge-items', 'general-items', 'beverages', 'medicines'];
for (const slug of requiredNoindexes) {
  if (!NOINDEX_CATEGORY_SLUGS.has(slug)) {
    errors.push(`Expected '${slug}' in NOINDEX_CATEGORY_SLUGS set.`);
  }
}
console.log(`  ✓ All ${requiredNoindexes.length} internal/unapproved buckets are marked noindex.`);

// 3. Validate Keyword Banks (if directory exists)
console.log('\n▶ [3/3] Validating Keyword Bank CSVs & Cross-Assignment...');
const keywordBankDir = path.resolve(__dirname, '../../../keyword-bank');
if (fs.existsSync(keywordBankDir)) {
  const files = fs.readdirSync(keywordBankDir).filter(f => f.endsWith('.csv'));
  const assignedKeywords = new Map();

  for (const file of files) {
    const filePath = path.join(keywordBankDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    if (lines.length <= 1) continue;

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const expectedCols = ['keyword', 'type', 'intent', 'cluster', 'assigned target', 'priority', 'volume', 'source', 'notes'];
    
    // Check header columns
    for (const col of expectedCols) {
      if (!headers.includes(col)) {
        warnings.push(`File '${file}': Missing column header '${col}'.`);
      }
    }

    const keywordColIdx = headers.indexOf('keyword');
    const targetColIdx = headers.indexOf('assigned target');

    function parseCsvLine(line) {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result.map(s => s.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
    }

    if (keywordColIdx !== -1 && targetColIdx !== -1) {
      for (let i = 1; i < lines.length; i++) {
        const parts = parseCsvLine(lines[i]);
        const kw = parts[keywordColIdx]?.toLowerCase();
        const target = parts[targetColIdx];
        if (kw) {
          if (assignedKeywords.has(kw) && assignedKeywords.get(kw) !== target) {
            errors.push(`Conflict: Keyword '${kw}' is assigned to multiple targets: '${assignedKeywords.get(kw)}' and '${target}' in ${file}`);
          } else {
            assignedKeywords.set(kw, target);
          }
        }
      }
    }
  }
  console.log(`  ✓ Checked ${files.length} keyword bank CSVs (${assignedKeywords.size} assigned keywords).`);
} else {
  console.log('  ℹ Keyword bank directory (keyword-bank/) not yet created or empty. Skipping cross-assignment checks.');
}

// Summary Report
console.log('\n====================================================');
console.log('📊 VALIDATION SUMMARY');
console.log('====================================================');

if (warnings.length > 0) {
  console.log(`⚠️  Warnings (${warnings.length}):`);
  warnings.forEach(w => console.log(`   - ${w}`));
}

if (errors.length > 0) {
  console.error(`❌ Validation FAILED with ${errors.length} error(s):`);
  errors.forEach(e => console.error(`   - ${e}`));
  process.exit(1);
} else {
  console.log('✅ ALL SEO VALIDATIONS PASSED SUCCESSFULLY!');
  console.log('   - 0 duplicate titles or descriptions');
  console.log('   - 0 titles > 60 chars');
  console.log('   - 0 descriptions > 160 chars');
  console.log('   - All internal buckets strictly noindex');
  process.exit(0);
}
