// Analyze IPA characters
const testWords = [
  { word: 'abandon', ipa: '/əˈbændən/' },
  { word: 'dictionary', ipa: '/ˈdɪkʃəˌnɛɹi/' },
  { word: 'syllable', ipa: '/ˈsɪɫəbəɫ/' }
];

const vowelPattern = /[aeiouəɑɛɪɔʊæʌɜɝɐɒʉɨɵøœɶɞʏ]/i;

testWords.forEach(({ word, ipa }) => {
  const cleaned = ipa.replace(/^\/|\/$/g, '');
  console.log(`\n${word}: ${ipa}`);
  console.log('Characters:');

  cleaned.split('').forEach((char, i) => {
    const isVowel = vowelPattern.test(char);
    const isStress = char === 'ˈ' || char === 'ˌ';
    const marker = isVowel ? ' <- VOWEL' : (isStress ? ' <- STRESS' : '');
    console.log(`  ${i}: '${char}'${marker}`);
  });

  const vowelCount = cleaned.split('').filter(c => vowelPattern.test(c)).length;
  console.log(`Vowel count: ${vowelCount}`);
});
