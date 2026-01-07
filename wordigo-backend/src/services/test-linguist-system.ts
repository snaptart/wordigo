/**
 * Test script for the Linguist Wrong Definition System
 *
 * This script tests each difficulty level to ensure the system works correctly.
 * Run with: npx ts-node src/services/test-linguist-system.ts
 */

import { PrismaClient } from '@prisma/client';
import { getLinguistWrongDefinitions } from './linguistWrongDefinitionService';

const prisma = new PrismaClient();

interface TestWord {
  lemma: string;
  expectedLevel: number;
  description: string;
}

// Test words for each difficulty level
const TEST_WORDS: TestWord[] = [
  { lemma: 'dog', expectedLevel: 1, description: 'Common noun with clear category' },
  { lemma: 'apple', expectedLevel: 2, description: 'Fruit with clear taxonomy' },
  { lemma: 'car', expectedLevel: 3, description: 'Vehicle with many siblings' },
  { lemma: 'bicycle', expectedLevel: 4, description: 'Object with clear parts' },
  { lemma: 'happy', expectedLevel: 5, description: 'Adjective with near-synonyms' },
];

async function getTestWord(lemma: string) {
  const sense = await prisma.senses.findFirst({
    where: {
      words: {
        lemma: lemma
      }
    },
    include: {
      words: true,
      synsets: {
        include: {
          lexdomains: true
        }
      },
      casedwords: true,
      wordigo_difficulty_calculated: true
    }
  });

  if (!sense) {
    throw new Error(`Word "${lemma}" not found in database`);
  }

  const calcDiff = sense.wordigo_difficulty_calculated;

  return {
    wordid: sense.words.wordid,
    lemma: sense.words.lemma,
    cased: sense.casedwords?.cased,
    definition: sense.synsets.definition,
    casedwordid: sense.casedwordid,
    synsetid: sense.synsetid,
    senseid: sense.senseid,
    lexdomainid: sense.synsets.lexdomainid,
    lexdomainname: sense.synsets.lexdomains.lexdomainname,
    pos: sense.synsets.pos,
    posName: sense.synsets.pos,
    word_in_definition: calcDiff?.word_in_definition ?? null,
    def_num_chars: calcDiff?.def_char_count ?? null,
    overall_difficulty_score: calcDiff?.overall_difficulty_score ? Number(calcDiff.overall_difficulty_score) : null,
    difficulty_band: calcDiff?.difficulty_band ?? null,
  };
}

async function testLevel(level: number, testWord: TestWord) {
  console.log('\n' + '='.repeat(80));
  console.log(`TESTING LEVEL ${level}: ${testWord.description}`);
  console.log(`Test Word: "${testWord.lemma}"`);
  console.log('='.repeat(80));

  try {
    // Get the word data
    const wordData = await getTestWord(testWord.lemma);

    console.log(`\n📖 Correct Definition: "${wordData.definition}"`);
    console.log(`   Domain: ${wordData.lexdomainname}, POS: ${wordData.pos}`);

    // Get wrong definitions using linguist system
    const wrongDefs = await getLinguistWrongDefinitions(
      wordData,
      level,
      {
        wordLengthFilter: 'all',
        allowObscureWords: true
      }
    );

    console.log(`\n✅ Found ${wrongDefs.length} wrong definitions:\n`);

    wrongDefs.forEach((wd, idx) => {
      console.log(`${idx + 1}. Word: "${wd.word.lemma}"`);
      console.log(`   Definition: "${wd.word.definition}"`);
      console.log(`   Strategy: ${wd.strategy}`);
      console.log(`   Link Type: ${wd.linkType || 'none'}`);
      console.log(`   Domain: ${wd.word.lexdomainname}`);
      console.log(`   Semantic Distance: ${wd.semanticDistance || 'N/A'} hops`);
      console.log('');
    });

    // Validation checks
    const issues: string[] = [];

    // Check: Should have exactly 3 wrong definitions
    if (wrongDefs.length !== 3) {
      issues.push(`❌ Expected 3 wrong definitions, got ${wrongDefs.length}`);
    }

    // Check: No duplicate lemmas
    const lemmas = [wordData.lemma, ...wrongDefs.map(w => w.word.lemma)];
    const uniqueLemmas = new Set(lemmas.map(l => l.toLowerCase()));
    if (uniqueLemmas.size !== lemmas.length) {
      issues.push(`❌ Duplicate lemmas found!`);
    }

    // Check: All same POS
    const wrongPOS = wrongDefs.filter(w => w.word.pos !== wordData.pos);
    if (wrongPOS.length > 0) {
      issues.push(`❌ ${wrongPOS.length} definitions have different POS`);
    }

    // Check: No duplicate synsets
    const synsetIds = [wordData.synsetid, ...wrongDefs.map(w => w.word.synsetid)];
    const uniqueSynsets = new Set(synsetIds);
    if (uniqueSynsets.size !== synsetIds.length) {
      issues.push(`❌ Duplicate synsets found!`);
    }

    // Report results
    if (issues.length === 0) {
      console.log('✅ ALL VALIDATION CHECKS PASSED!');
    } else {
      console.log('\n⚠️  VALIDATION ISSUES:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }

    return {
      level,
      word: testWord.lemma,
      success: issues.length === 0,
      wrongDefCount: wrongDefs.length,
      issues
    };

  } catch (error) {
    console.error(`\n❌ ERROR testing level ${level}:`, error);
    return {
      level,
      word: testWord.lemma,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║        LINGUIST WRONG DEFINITION SYSTEM - COMPREHENSIVE TEST          ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝');

  const results = [];

  // Test all 5 levels with appropriate test words
  for (let level = 1; level <= 5; level++) {
    const testWord = TEST_WORDS[level - 1] || TEST_WORDS[0];
    const result = await testLevel(level, testWord);
    results.push(result);

    // Pause between tests for readability
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80) + '\n');

  const successCount = results.filter(r => r.success).length;
  const totalTests = results.length;

  results.forEach(r => {
    const status = r.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - Level ${r.level}: ${r.word}`);
    if (!r.success && r.error) {
      console.log(`         Error: ${r.error}`);
    }
    if (!r.success && r.issues) {
      r.issues.forEach(issue => console.log(`         ${issue}`));
    }
  });

  console.log('');
  console.log(`Results: ${successCount}/${totalTests} tests passed`);

  if (successCount === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! The linguist system is working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Review the errors above.\n');
  }

  await prisma.$disconnect();
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
