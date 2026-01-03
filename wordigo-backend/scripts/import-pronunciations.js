/**
 * Import IPA Pronunciations from en_US.txt into Database
 *
 * This script reads the en_US.txt file (IPA dictionary) and imports
 * pronunciation data into the wordigo_pronunciations table.
 *
 * File format: word\t/IPA/
 * Some words have multiple pronunciations: word\t/IPA1/, /IPA2/
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const prisma = new PrismaClient();

// Path to the pronunciation data file
const PRONUNCIATION_FILE = path.join(__dirname, '../../en_US.txt');

// Batch size for database inserts
const BATCH_SIZE = 1000;

async function importPronunciations() {
  console.log('Starting pronunciation import...');
  console.log(`Reading from: ${PRONUNCIATION_FILE}`);

  if (!fs.existsSync(PRONUNCIATION_FILE)) {
    console.error(`Error: File not found at ${PRONUNCIATION_FILE}`);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(PRONUNCIATION_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let batch = [];
  let lineCount = 0;
  let importCount = 0;
  let errorCount = 0;

  for await (const line of rl) {
    lineCount++;

    try {
      // Parse line: word\t/IPA/
      const parts = line.split('\t');
      if (parts.length !== 2) {
        console.warn(`Line ${lineCount}: Invalid format - ${line}`);
        errorCount++;
        continue;
      }

      const word = parts[0].trim().toLowerCase();
      const ipaPart = parts[1].trim();

      // Some words have multiple pronunciations separated by ", /"
      // Example: "a	/ˈeɪ/, /ə/"
      const pronunciations = ipaPart.split(', /').map(ipa => {
        // Remove leading/trailing slashes and whitespace
        return ipa.replace(/^\/|\/$/g, '').trim();
      });

      // Find matching word in the words table
      const wordRecord = await prisma.words.findFirst({
        where: {
          lemma: word
        }
      });

      const wordid = wordRecord ? wordRecord.wordid : null;

      // Create pronunciation records for each variant
      for (const ipa of pronunciations) {
        batch.push({
          word,
          wordid,
          ipa: `/${ipa}/` // Store with slashes for consistency
        });
      }

      // Insert batch when it reaches BATCH_SIZE
      if (batch.length >= BATCH_SIZE) {
        await prisma.wordigo_pronunciations.createMany({
          data: batch,
          skipDuplicates: true
        });
        importCount += batch.length;
        console.log(`Imported ${importCount} pronunciations (${lineCount} lines processed)...`);
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
    await prisma.wordigo_pronunciations.createMany({
      data: batch,
      skipDuplicates: true
    });
    importCount += batch.length;
  }

  console.log('\n=== Import Complete ===');
  console.log(`Total lines processed: ${lineCount}`);
  console.log(`Total pronunciations imported: ${importCount}`);
  console.log(`Errors: ${errorCount}`);

  // Show statistics
  const stats = await prisma.$queryRaw`
    SELECT
      COUNT(*) as total_pronunciations,
      COUNT(DISTINCT word) as unique_words,
      COUNT(CASE WHEN wordid IS NOT NULL THEN 1 END) as matched_to_wordnet,
      COUNT(CASE WHEN wordid IS NULL THEN 1 END) as unmatched
    FROM wordigo_pronunciations
  `;

  console.log('\n=== Database Statistics ===');
  console.log(`Total pronunciations in DB: ${stats[0].total_pronunciations}`);
  console.log(`Unique words: ${stats[0].unique_words}`);
  console.log(`Matched to WordNet: ${stats[0].matched_to_wordnet}`);
  console.log(`Not in WordNet: ${stats[0].unmatched}`);

  await prisma.$disconnect();
}

// Run the import
importPronunciations()
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
