/**
 * Test script to verify pronunciation functionality
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPronunciation() {
  console.log('Testing pronunciation lookup...\n');

  // Test words
  const testWords = ['hello', 'abandon', 'dictionary', 'syllable', 'pronunciation'];

  for (const word of testWords) {
    console.log(`\n--- Testing word: "${word}" ---`);

    // Look up pronunciation
    const pronunciations = await prisma.wordigo_pronunciations.findMany({
      where: { word },
      take: 3
    });

    if (pronunciations.length === 0) {
      console.log(`  ❌ No pronunciation found`);
    } else {
      console.log(`  ✓ Found ${pronunciations.length} pronunciation(s):`);
      pronunciations.forEach((p, i) => {
        console.log(`    ${i + 1}. ${p.ipa}`);
      });
    }

    // Check if word exists in WordNet
    const wordRecord = await prisma.words.findFirst({
      where: { lemma: word }
    });

    if (wordRecord) {
      console.log(`  ✓ Word exists in WordNet (ID: ${wordRecord.wordid})`);
    } else {
      console.log(`  ⚠ Word not in WordNet`);
    }
  }

  console.log('\n\n=== Database Statistics ===');
  const stats = await prisma.$queryRaw`
    SELECT
      COUNT(*) as total,
      COUNT(DISTINCT word) as unique_words,
      COUNT(CASE WHEN wordid IS NOT NULL THEN 1 END) as linked_to_wordnet
    FROM wordigo_pronunciations
  `;

  console.log(`Total pronunciations: ${stats[0].total}`);
  console.log(`Unique words: ${stats[0].unique_words}`);
  console.log(`Linked to WordNet: ${stats[0].linked_to_wordnet}`);

  await prisma.$disconnect();
}

testPronunciation().catch(console.error);
