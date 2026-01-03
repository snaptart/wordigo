/**
 * Test English syllabifier accuracy
 */

const { syllabifyEnglishWord, formatEnglishSyllables } = require('../dist/utils/englishSyllabifier');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEnglishSyllabifier() {
  console.log('Testing English syllabifier...\n');

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
    'telephone',
    'education',
    'wonderful',
    'important',
    'example',
    'together'
  ];

  for (const word of testWords) {
    // Get CMUDict data
    const cmudict = await prisma.wordigo_cmudict_syllables.findFirst({
      where: { word }
    });

    if (!cmudict) {
      console.log(`${word}: No CMUDict data`);
      continue;
    }

    // Syllabify using our algorithm
    const syllables = syllabifyEnglishWord(word, cmudict.syllable_count);
    const formatted = formatEnglishSyllables(syllables);

    console.log(`\n${word} (${cmudict.syllable_count} syllables):`);
    console.log(`  ARPABET: ${cmudict.syllables.join('·')}`);
    console.log(`  English: ${formatted}`);
    console.log(`  Array:   [${syllables.join(', ')}]`);
  }

  await prisma.$disconnect();
}

testEnglishSyllabifier().catch(console.error);
