/**
 * Test hypher syllabification vs CMUDict syllables
 */

const Hypher = require('hypher');
const english = require('hyphenation.en-us');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testHypher() {
  console.log('Testing Hypher accuracy vs CMUDict...\n');

  const h = new Hypher(english);

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

  let matchCount = 0;
  let totalCount = 0;

  for (const word of testWords) {
    // Get CMUDict data
    const cmudict = await prisma.wordigo_cmudict_syllables.findFirst({
      where: { word }
    });

    // Get hyphenation (returns array of syllables)
    const hyphenParts = h.hyphenate(word);

    console.log(`\n${word}:`);
    if (cmudict) {
      console.log(`  CMUDict: ${cmudict.syllables.join('·')} (${cmudict.syllable_count})`);
    }
    console.log(`  Hypher:  ${hyphenParts.join('·')} (${hyphenParts.length})`);

    if (cmudict) {
      const match = hyphenParts.length === cmudict.syllable_count;
      console.log(`  ${match ? '✓' : '✗'} ${match ? 'MATCH' : 'MISMATCH'}`);

      if (match) matchCount++;
      totalCount++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Matches: ${matchCount}/${totalCount} (${Math.round(matchCount/totalCount*100)}%)`);

  await prisma.$disconnect();
}

testHypher().catch(console.error);
