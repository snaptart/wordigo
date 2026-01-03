/**
 * Test hyphenation vs CMUDict syllables
 */

const hyphen = require('hyphen');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testHyphenation() {
  console.log('Testing hyphenation accuracy vs CMUDict...\n');

  // Load English (US) hyphenation patterns
  const enUsPatterns = require('hyphen/patterns/en-us');
  const hyphenator = hyphen.factory(enUsPatterns);

  const testWords = [
    'abandon',
    'hello',
    'dictionary',
    'syllable',
    'pronunciation',
    'beautiful',
    'incredible',
    'necessary',
    'computer',
    'telephone'
  ];

  for (const word of testWords) {
    // Get CMUDict data
    const cmudict = await prisma.wordigo_cmudict_syllables.findFirst({
      where: { word }
    });

    // Get hyphenation
    const hyphenated = hyphenator(word);
    const hyphenParts = hyphenated.split('\u00AD'); // soft hyphen character

    console.log(`\n${word}:`);
    console.log(`  CMUDict: ${cmudict ? cmudict.syllables.join('·') : 'N/A'}`);
    console.log(`  CMU Count: ${cmudict ? cmudict.syllable_count : 'N/A'}`);
    console.log(`  Hyphen: ${hyphenParts.join('·')}`);
    console.log(`  Hyphen Count: ${hyphenParts.length}`);

    if (cmudict) {
      const match = hyphenParts.length === cmudict.syllable_count ? '✓' : '✗';
      console.log(`  Match: ${match} ${hyphenParts.length === cmudict.syllable_count ? 'SAME' : 'DIFFERENT'}`);
    }
  }

  await prisma.$disconnect();
}

testHyphenation().catch(console.error);
