/**
 * Test syllable parsing from IPA notation
 */

// Since we're using CommonJS for scripts, we need to import the compiled JS
const { parseSyllablesFromIPA, formatSyllablesForDisplay } = require('../dist/utils/pronunciationUtils');

console.log('Testing syllable parsing from IPA...\n');

const testCases = [
  { word: 'abandon', ipa: '/əˈbændən/' },
  { word: 'hello', ipa: '/həˈɫoʊ/' },
  { word: 'dictionary', ipa: '/ˈdɪkʃəˌnɛɹi/' },
  { word: 'syllable', ipa: '/ˈsɪɫəbəɫ/' },
  { word: 'pronunciation', ipa: '/pɹəˌnənsiˈeɪʃən/' },
  { word: 'A.D.', ipa: '/ˌeɪˈdi/' },
  { word: 'triple-A', ipa: '/ˌtɹɪpəˈɫeɪ/' }
];

testCases.forEach(({ word, ipa }) => {
  console.log(`\n--- ${word} (${ipa}) ---`);

  const result = parseSyllablesFromIPA(ipa);

  console.log(`  Syllables: [${result.syllables.join(', ')}]`);
  console.log(`  Count: ${result.syllableCount}`);

  if (result.primaryStress !== undefined) {
    console.log(`  Primary stress: syllable ${result.primaryStress + 1}`);
  }

  if (result.secondaryStress !== undefined) {
    console.log(`  Secondary stress: syllable ${result.secondaryStress + 1}`);
  }

  const formatted = formatSyllablesForDisplay(
    result.syllables,
    result.primaryStress,
    result.secondaryStress
  );

  console.log(`  Formatted: ${formatted}`);
});
