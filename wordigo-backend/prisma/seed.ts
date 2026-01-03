import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding difficulty presets...');

  // Clear existing presets
  await prisma.gameDifficultyPreset.deleteMany({});

  // Create difficulty presets
  const presets = [
    {
      name: 'easy',
      displayName: 'Easy',
      wordCount: 5,
      timeLimit: 25,
      difficultyBand: 1, // Easiest words
      description: 'Perfect for beginners - 5 words in 25 seconds with simple definitions',
      isActive: true,
    },
    {
      name: 'medium',
      displayName: 'Medium',
      wordCount: 10,
      timeLimit: 50,
      difficultyBand: 2, // Moderate difficulty
      description: 'Balanced challenge - 10 words in 50 seconds',
      isActive: true,
    },
    {
      name: 'hard',
      displayName: 'Hard',
      wordCount: 15,
      timeLimit: 75,
      difficultyBand: 3, // Harder words
      description: 'Expert mode - 15 words in 75 seconds with complex definitions',
      isActive: true,
    },
  ];

  for (const preset of presets) {
    await prisma.gameDifficultyPreset.create({
      data: preset,
    });
    console.log(`Created preset: ${preset.displayName}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
