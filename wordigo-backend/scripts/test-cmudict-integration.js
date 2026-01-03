/**
 * Test CMUDict syllable integration with word lookup
 */

const { lookupWord } = require('../dist/services/wordLookupService');

async function testCMUDictIntegration() {
  console.log('Testing CMUDict syllable integration...\n');

  const testWords = ['abandon', 'hello', 'dictionary', 'syllable', 'pronunciation'];

  for (const word of testWords) {
    console.log(`\n=== Testing: ${word} ===`);

    try {
      const result = await lookupWord(word);

      if (!result) {
        console.log('  ❌ Word not found in WordNet');
        continue;
      }

      console.log(`  ✓ Word found in WordNet`);

      if (result.pronunciation) {
        console.log(`  IPA: ${result.pronunciation.ipa}`);
        console.log(`  Syllables: ${result.pronunciation.formattedSyllables}`);
        console.log(`  Syllable Count: ${result.pronunciation.syllableCount}`);
        console.log(`  Syllable Array: [${result.pronunciation.syllables.join(', ')}]`);
      } else {
        console.log('  ⚠ No pronunciation data');
      }

      console.log(`  Definitions: ${result.definitions.length}`);

    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
    }
  }

  process.exit(0);
}

testCMUDictIntegration().catch(console.error);
