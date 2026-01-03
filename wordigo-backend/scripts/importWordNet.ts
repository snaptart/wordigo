/**
 * Import WordNet 3.1 database from SQL dump to PostgreSQL
 *
 * This script reads the wordnet_3_1.sql file and imports all tables
 * including words, senses, synsets, lexdomains, and wordigo_difficulty
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const prisma = new PrismaClient();

interface ImportStats {
  words: number;
  senses: number;
  synsets: number;
  lexdomains: number;
  casedwords: number;
  difficulty: number;
}

const stats: ImportStats = {
  words: 0,
  senses: 0,
  synsets: 0,
  lexdomains: 0,
  casedwords: 0,
  difficulty: 0,
};

async function main() {
  console.log('🚀 Starting WordNet 3.1 import...\n');

  const sqlFilePath = path.join(__dirname, '../../wordnet_3_1.sql');

  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ SQL file not found at: ${sqlFilePath}`);
    console.log('💡 Please ensure wordnet_3_1.sql is in the wordigo root directory');
    process.exit(1);
  }

  console.log(`📁 Reading SQL file: ${sqlFilePath}`);
  console.log(`📊 File size: ${(fs.statSync(sqlFilePath).size / (1024 * 1024)).toFixed(2)} MB\n`);

  // Create readable stream for large file
  const fileStream = fs.createReadStream(sqlFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let currentTable = '';
  let insertBuffer: any[] = [];
  const BATCH_SIZE = 1000;

  console.log('📦 Processing SQL statements...\n');

  for await (const line of rl) {
    const trimmedLine = line.trim();

    // Skip comments and empty lines
    if (trimmedLine.startsWith('--') || trimmedLine.startsWith('/*') || trimmedLine.length === 0) {
      continue;
    }

    // Detect table from INSERT statements
    if (trimmedLine.startsWith('INSERT INTO')) {
      const match = trimmedLine.match(/INSERT INTO `?(\w+)`?/);
      if (match) {
        const tableName = match[1];

        // If switching tables, flush current buffer
        if (currentTable && currentTable !== tableName && insertBuffer.length > 0) {
          await flushBuffer(currentTable, insertBuffer);
          insertBuffer = [];
        }

        currentTable = tableName;

        // Parse VALUES
        const valuesMatch = trimmedLine.match(/VALUES\s*(.+);?$/);
        if (valuesMatch) {
          const valuesStr = valuesMatch[1].replace(/;$/, '');
          const rows = parseValues(valuesStr);
          insertBuffer.push(...rows);

          // Batch insert when buffer is full
          if (insertBuffer.length >= BATCH_SIZE) {
            await flushBuffer(currentTable, insertBuffer.slice(0, BATCH_SIZE));
            insertBuffer = insertBuffer.slice(BATCH_SIZE);
          }
        }
      }
    }
  }

  // Flush remaining buffer
  if (insertBuffer.length > 0) {
    await flushBuffer(currentTable, insertBuffer);
  }

  console.log('\n✅ Import completed successfully!\n');
  console.log('📊 Import Statistics:');
  console.log(`   Words:       ${stats.words.toLocaleString()}`);
  console.log(`   Senses:      ${stats.senses.toLocaleString()}`);
  console.log(`   Synsets:     ${stats.synsets.toLocaleString()}`);
  console.log(`   Lexdomains:  ${stats.lexdomains.toLocaleString()}`);
  console.log(`   Casedwords:  ${stats.casedwords.toLocaleString()}`);
  console.log(`   Difficulty:  ${stats.difficulty.toLocaleString()}`);
  console.log(`\n   Total rows:  ${Object.values(stats).reduce((a, b) => a + b, 0).toLocaleString()}`);
}

/**
 * Parse SQL VALUES string into array of value arrays
 */
function parseValues(valuesStr: string): any[][] {
  const rows: any[][] = [];
  let currentRow: any[] = [];
  let currentValue = '';
  let inString = false;
  let inParens = false;
  let escapeNext = false;

  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];

    if (escapeNext) {
      currentValue += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      currentValue += char;
      continue;
    }

    if (char === "'" && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '(') {
        inParens = true;
        continue;
      }

      if (char === ')') {
        inParens = false;
        // Push last value
        currentRow.push(parseValue(currentValue.trim()));
        rows.push(currentRow);
        currentRow = [];
        currentValue = '';
        continue;
      }

      if (char === ',' && inParens) {
        currentRow.push(parseValue(currentValue.trim()));
        currentValue = '';
        continue;
      }

      if (char === ',' && !inParens) {
        // Between rows
        continue;
      }
    }

    if (inString || (inParens && char !== ',' && char !== ')')) {
      currentValue += char;
    }
  }

  return rows;
}

/**
 * Parse individual value (handle NULL, numbers, strings)
 */
function parseValue(value: string): any {
  if (value === 'NULL' || value === '') {
    return null;
  }

  // Check if it's a number
  if (/^-?\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  if (/^-?\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }

  // It's a string, remove quotes if present
  return value.replace(/^'|'$/g, '').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
}

/**
 * Insert batch of rows into appropriate table
 */
async function flushBuffer(tableName: string, rows: any[][]) {
  if (rows.length === 0) return;

  try {
    switch (tableName.toLowerCase()) {
      case 'words':
        await insertWords(rows);
        break;
      case 'senses':
        await insertSenses(rows);
        break;
      case 'synsets':
        await insertSynsets(rows);
        break;
      case 'lexdomains':
        await insertLexdomains(rows);
        break;
      case 'casedwords':
        await insertCasedwords(rows);
        break;
      case 'wordigo_difficulty':
        await insertDifficulty(rows);
        break;
      default:
        console.log(`⚠️  Unknown table: ${tableName}`);
    }
  } catch (error) {
    console.error(`❌ Error inserting into ${tableName}:`, error);
    throw error;
  }
}

async function insertWords(rows: any[][]) {
  const data = rows.map(row => ({
    wordid: row[0],
    lemma: row[1]
  }));

  await prisma.word.createMany({ data, skipDuplicates: true });
  stats.words += rows.length;
  process.stdout.write(`\r📝 Words: ${stats.words.toLocaleString()}      `);
}

async function insertSenses(rows: any[][]) {
  const data = rows.map(row => ({
    senseid: row[0],
    wordid: row[1],
    synsetid: row[2],
    casedwordid: row[3],
    lexid: row[4],
    tagcount: row[5],
    sensenum: row[6],
    sensekey: row[7]
  }));

  await prisma.sense.createMany({ data, skipDuplicates: true });
  stats.senses += rows.length;
  process.stdout.write(`\r🔗 Senses: ${stats.senses.toLocaleString()}      `);
}

async function insertSynsets(rows: any[][]) {
  const data = rows.map(row => ({
    synsetid: row[0],
    definition: row[1],
    lexdomainid: row[2]
  }));

  await prisma.synset.createMany({ data, skipDuplicates: true });
  stats.synsets += rows.length;
  process.stdout.write(`\r📖 Synsets: ${stats.synsets.toLocaleString()}      `);
}

async function insertLexdomains(rows: any[][]) {
  const data = rows.map(row => ({
    lexdomainid: row[0],
    lexdomainname: row[1]
  }));

  await prisma.lexdomain.createMany({ data, skipDuplicates: true });
  stats.lexdomains += rows.length;
  process.stdout.write(`\r🏷️  Lexdomains: ${stats.lexdomains.toLocaleString()}      `);
}

async function insertCasedwords(rows: any[][]) {
  const data = rows.map(row => ({
    casedwordid: row[0],
    cased: row[1]
  }));

  await prisma.casedWord.createMany({ data, skipDuplicates: true });
  stats.casedwords += rows.length;
  process.stdout.write(`\r🔤 Casedwords: ${stats.casedwords.toLocaleString()}      `);
}

async function insertDifficulty(rows: any[][]) {
  const data = rows.map(row => ({
    senseid: row[0],
    word_syllable_count: row[1],
    word_in_definition: row[2] === 1 || row[2] === true,
    def_avg_read_score: row[3],
    def_num_chars: row[4],
    def_avg_read_score_band: row[5],
    def_num_chars_band: row[6]
  }));

  await prisma.wordigoDifficulty.createMany({ data, skipDuplicates: true });
  stats.difficulty += rows.length;
  process.stdout.write(`\r📊 Difficulty: ${stats.difficulty.toLocaleString()}      `);
}

main()
  .catch((error) => {
    console.error('\n❌ Fatal error during import:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
