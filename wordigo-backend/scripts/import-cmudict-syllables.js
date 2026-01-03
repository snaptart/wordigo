/**
 * Import CMUDict Syllabified Data into Database
 *
 * This script reads the cmudict-syllabified.txt file and imports
 * syllable data into the wordigo_cmudict_syllables table.
 *
 * Format: WORD  PHONEME1 PHONEME2 - PHONEME3 - PHONEME4
 * Where "-" marks syllable boundaries
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const prisma = new PrismaClient();

// Path to the CMUDict syllabified file
const CMUDICT_FILE = path.join(__dirname, '../../cmudict-syllabified.txt');

// Batch size for database inserts
const BATCH_SIZE = 1000;

async function importCMUDictSyllables() {
  console.log('Starting CMUDict syllables import...');
  console.log(`Reading from: ${CMUDICT_FILE}`);

  if (!fs.existsSync(CMUDICT_FILE)) {
    console.error(`Error: File not found at ${CMUDICT_FILE}`);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(CMUDICT_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let batch = [];
  let lineCount = 0;
  let importCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for await (const line of rl) {
    lineCount++;

    // Skip comments and empty lines
    if (line.startsWith('##') || line.startsWith(';;;') || line.trim() === '') {
      continue;
    }

    try {
      // Parse line: WORD  PHONEME1 PHONEME2 - PHONEME3 - PHONEME4
      const parts = line.split(/\s+/);
      if (parts.length < 2) {
        skippedCount++;
        continue;
      }

      let word = parts[0].toLowerCase();

      // Skip entries with numbers (variants like WORD(2))
      if (word.includes('(')) {
        skippedCount++;
        continue;
      }

      // Get phonemes (everything after the word)
      const phonemes = parts.slice(1);

      // Split phonemes into syllables (separated by "-")
      const syllables = [];
      let currentSyllable = [];

      for (const phoneme of phonemes) {
        if (phoneme === '-') {
          // Syllable boundary - save current syllable
          if (currentSyllable.length > 0) {
            syllables.push(currentSyllable.join(' '));
            currentSyllable = [];
          }
        } else {
          currentSyllable.push(phoneme);
        }
      }

      // Add last syllable
      if (currentSyllable.length > 0) {
        syllables.push(currentSyllable.join(' '));
      }

      if (syllables.length === 0) {
        skippedCount++;
        continue;
      }

      // Full ARPABET pronunciation (without hyphens)
      const arpabet = phonemes.filter(p => p !== '-').join(' ');

      // Find matching word in the words table
      const wordRecord = await prisma.words.findFirst({
        where: {
          lemma: word
        }
      });

      const wordid = wordRecord ? wordRecord.wordid : null;

      // Add to batch
      batch.push({
        word,
        wordid,
        arpabet,
        syllable_count: syllables.length,
        syllables
      });

      // Insert batch when it reaches BATCH_SIZE
      if (batch.length >= BATCH_SIZE) {
        await prisma.wordigo_cmudict_syllables.createMany({
          data: batch,
          skipDuplicates: true
        });
        importCount += batch.length;
        console.log(`Imported ${importCount} entries (${lineCount} lines processed)...`);
        batch = [];
      }

    } catch (error) {
      console.error(`Error processing line ${lineCount}: ${line}`);
      console.error(error.message);
      errorCount++;
    }
  }

  // Insert remaining batch
  if (batch.length > 0) {
    await prisma.wordigo_cmudict_syllables.createMany({
      data: batch,
      skipDuplicates: true
    });
    importCount += batch.length;
  }

  console.log('\n=== Import Complete ===');
  console.log(`Total lines processed: ${lineCount}`);
  console.log(`Total entries imported: ${importCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);

  // Show statistics
  const stats = await prisma.$queryRaw`
    SELECT
      COUNT(*) as total_entries,
      COUNT(DISTINCT word) as unique_words,
      COUNT(CASE WHEN wordid IS NOT NULL THEN 1 END) as matched_to_wordnet,
      COUNT(CASE WHEN wordid IS NULL THEN 1 END) as unmatched,
      AVG(syllable_count) as avg_syllables,
      MAX(syllable_count) as max_syllables
    FROM wordigo_cmudict_syllables
  `;

  console.log('\n=== Database Statistics ===');
  console.log(`Total entries in DB: ${stats[0].total_entries}`);
  console.log(`Unique words: ${stats[0].unique_words}`);
  console.log(`Matched to WordNet: ${stats[0].matched_to_wordnet}`);
  console.log(`Not in WordNet: ${stats[0].unmatched}`);
  console.log(`Average syllables: ${parseFloat(stats[0].avg_syllables).toFixed(2)}`);
  console.log(`Max syllables: ${stats[0].max_syllables}`);

  // Test some words
  console.log('\n=== Test Lookups ===');
  const testWords = ['abandon', 'hello', 'dictionary', 'syllable'];

  for (const testWord of testWords) {
    const result = await prisma.wordigo_cmudict_syllables.findFirst({
      where: { word: testWord }
    });

    if (result) {
      console.log(`\n${testWord}:`);
      console.log(`  ARPABET: ${result.arpabet}`);
      console.log(`  Syllables (${result.syllable_count}): ${result.syllables.join(' - ')}`);
    }
  }

  await prisma.$disconnect();
}

// Run the import
importCMUDictSyllables()
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
