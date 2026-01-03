/**
 * Check if we have part of speech data
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPOS() {
  console.log('Checking for part of speech data...\n');

  // Check the synsets table - it has a 'pos' field
  const word = await prisma.words.findFirst({
    where: { lemma: 'abandon' },
    include: {
      senses: {
        include: {
          synsets: true
        },
        take: 5
      }
    }
  });

  console.log('Word: abandon');
  console.log('\nSenses and their parts of speech:');

  word.senses.forEach((sense, i) => {
    console.log(`\n${i + 1}. Sense ID: ${sense.senseid}`);
    console.log(`   POS: ${sense.synsets.pos}`);
    console.log(`   Definition: ${sense.synsets.definition}`);
  });

  // Check postypes table
  console.log('\n\n=== Available POS Types ===');
  const posTypes = await prisma.postypes.findMany();
  posTypes.forEach(pos => {
    console.log(`${pos.pos} = ${pos.posname}`);
  });

  await prisma.$disconnect();
}

checkPOS().catch(console.error);
