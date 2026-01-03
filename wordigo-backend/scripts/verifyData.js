"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function verify() {
    console.log('🔍 Verifying PostgreSQL database...\n');
    const wordCount = await prisma.word.count();
    const senseCount = await prisma.sense.count();
    const synsetCount = await prisma.synset.count();
    const lexdomainCount = await prisma.lexdomain.count();
    const casedwordCount = await prisma.casedWord.count();
    const difficultyCount = await prisma.wordigoDifficulty.count();
    console.log('📊 Record Counts:');
    console.log(`   Words:       ${wordCount.toLocaleString()}`);
    console.log(`   Senses:      ${senseCount.toLocaleString()}`);
    console.log(`   Synsets:     ${synsetCount.toLocaleString()}`);
    console.log(`   Lexdomains:  ${lexdomainCount.toLocaleString()}`);
    console.log(`   Casedwords:  ${casedwordCount.toLocaleString()}`);
    console.log(`   Difficulty:  ${difficultyCount.toLocaleString()}\n`);
    // Sample a random word
    const randomWord = await prisma.word.findFirst({
        where: { wordid: Math.floor(Math.random() * 147478) + 1 },
        include: {
            senses: {
                take: 1,
                include: {
                    synset: true,
                    difficulty: true
                }
            }
        }
    });
    if (randomWord && randomWord.senses.length > 0) {
        const sense = randomWord.senses[0];
        console.log('📝 Sample Word:');
        console.log(`   Word: "${randomWord.lemma}"`);
        console.log(`   Definition: "${sense.synset.definition}"`);
        if (sense.difficulty) {
            console.log(`   Difficulty band: ${sense.difficulty.def_avg_read_score_band}`);
            console.log(`   Character band: ${sense.difficulty.def_num_chars_band}`);
        }
    }
    console.log('\n✅ Database verification complete!');
    await prisma.$disconnect();
}
verify().catch(console.error);
//# sourceMappingURL=verifyData.js.map