const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPrisma() {
  try {
    console.log('Testing Prisma connection...');

    // Test 1: Try to find a word
    const word = await prisma.words.findFirst({
      where: { lemma: 'cat' }
    });

    console.log('Word found:', word);

    if (!word) {
      console.log('No word found for "cat"');
      await prisma.$disconnect();
      return;
    }

    // Test 2: Try to find senses
    const senses = await prisma.senses.findMany({
      where: { wordid: word.wordid },
      take: 3
    });

    console.log(`Found ${senses.length} senses`);
    console.log('First sense:', senses[0]);

    await prisma.$disconnect();
    console.log('✅ Prisma is working!');
  } catch (error) {
    console.error('❌ Prisma error:', error.message);
    console.error('Full error:', error);
    await prisma.$disconnect();
  }
}

testPrisma();
