"use strict";
/**
 * Migrate WordNet data from MySQL to PostgreSQL
 *
 * Reads data from existing MySQL database and writes to PostgreSQL
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const promise_1 = __importDefault(require("mysql2/promise"));
const prisma = new client_1.PrismaClient();
// MySQL connection config (from your config.php)
const mysqlConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'wordnet.3.1',
};
const stats = {
    words: 0,
    senses: 0,
    synsets: 0,
    lexdomains: 0,
    casedwords: 0,
    difficulty: 0,
    linktypes: 0,
    lexlinks: 0,
    semlinks: 0,
    samples: 0,
    morphs: 0,
    morphmaps: 0,
    postypes: 0,
    adjpositions: 0,
    adjpositiontypes: 0,
    vframes: 0,
    vframemaps: 0,
    vframesentences: 0,
    vframesentencemaps: 0,
};
async function main() {
    console.log('🚀 Starting MySQL → PostgreSQL migration...\n');
    let mysqlConnection;
    try {
        // Connect to MySQL
        console.log('📡 Connecting to MySQL database...');
        mysqlConnection = await promise_1.default.createConnection(mysqlConfig);
        console.log('✅ Connected to MySQL\n');
        // Migrate in order (respecting foreign keys)
        // 1. Lookup tables (no dependencies)
        console.log('\n--- Phase 1: Lookup Tables ---');
        await migrateLinktypes(mysqlConnection);
        await migratePostypes(mysqlConnection);
        await migrateAdjpositiontypes(mysqlConnection);
        await migrateVframes(mysqlConnection);
        await migrateVframesentences(mysqlConnection);
        await migrateMorphs(mysqlConnection);
        // 2. Core entity tables
        console.log('\n--- Phase 2: Core Entities ---');
        await migrateLexdomains(mysqlConnection);
        await migrateWords(mysqlConnection);
        await migrateSynsets(mysqlConnection);
        await migrateCasedwords(mysqlConnection);
        // 3. Dependent tables
        console.log('\n--- Phase 3: Relationships ---');
        await migrateSenses(mysqlConnection);
        await migrateDifficulty(mysqlConnection);
        await migrateLexlinks(mysqlConnection);
        await migrateSemlinks(mysqlConnection);
        await migrateSamples(mysqlConnection);
        await migrateMorphmaps(mysqlConnection);
        await migrateAdjpositions(mysqlConnection);
        await migrateVframemaps(mysqlConnection);
        await migrateVframesentencemaps(mysqlConnection);
        console.log('\n✅ Migration completed successfully!\n');
        console.log('📊 Migration Statistics:');
        console.log(`   Words:             ${stats.words.toLocaleString()}`);
        console.log(`   Senses:            ${stats.senses.toLocaleString()}`);
        console.log(`   Synsets:           ${stats.synsets.toLocaleString()}`);
        console.log(`   Lexdomains:        ${stats.lexdomains.toLocaleString()}`);
        console.log(`   Casedwords:        ${stats.casedwords.toLocaleString()}`);
        console.log(`   Difficulty:        ${stats.difficulty.toLocaleString()}`);
        console.log(`   Link types:        ${stats.linktypes.toLocaleString()}`);
        console.log(`   Lexical links:     ${stats.lexlinks.toLocaleString()}`);
        console.log(`   Semantic links:    ${stats.semlinks.toLocaleString()}`);
        console.log(`   Samples:           ${stats.samples.toLocaleString()}`);
        console.log(`   Morphs:            ${stats.morphs.toLocaleString()}`);
        console.log(`   Morph maps:        ${stats.morphmaps.toLocaleString()}`);
        console.log(`   POS types:         ${stats.postypes.toLocaleString()}`);
        console.log(`   Adj positions:     ${stats.adjpositions.toLocaleString()}`);
        console.log(`   Adj pos types:     ${stats.adjpositiontypes.toLocaleString()}`);
        console.log(`   Verb frames:       ${stats.vframes.toLocaleString()}`);
        console.log(`   Verb frame maps:   ${stats.vframemaps.toLocaleString()}`);
        console.log(`   VF sentences:      ${stats.vframesentences.toLocaleString()}`);
        console.log(`   VF sent maps:      ${stats.vframesentencemaps.toLocaleString()}`);
        console.log(`\n   Total rows:        ${Object.values(stats).reduce((a, b) => a + b, 0).toLocaleString()}`);
    }
    catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    }
    finally {
        if (mysqlConnection) {
            await mysqlConnection.end();
            console.log('\n📡 MySQL connection closed');
        }
        await prisma.$disconnect();
        console.log('📡 PostgreSQL connection closed\n');
    }
}
async function migrateLexdomains(mysql) {
    console.log('📦 Migrating lexdomains...');
    const [rows] = await mysql.query('SELECT * FROM lexdomains');
    const data = rows;
    const BATCH_SIZE = 100;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE).map(row => ({
            lexdomainid: row.lexdomainid,
            lexdomainname: row.lexdomainname,
            lexdomain: row.lexdomain || null,
            pos: row.pos || null,
        }));
        await prisma.lexdomain.createMany({ data: batch, skipDuplicates: true });
        stats.lexdomains += batch.length;
        process.stdout.write(`\r   Lexdomains: ${stats.lexdomains}   `);
    }
    console.log(' ✅');
}
async function migrateCasedwords(mysql) {
    console.log('📦 Migrating casedwords...');
    const [rows] = await mysql.query('SELECT * FROM casedwords');
    const data = rows;
    const BATCH_SIZE = 1000;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE).map(row => ({
            casedwordid: row.casedwordid,
            wordid: row.wordid,
            cased: row.cased,
        }));
        await prisma.casedWord.createMany({ data: batch, skipDuplicates: true });
        stats.casedwords += batch.length;
        process.stdout.write(`\r   Casedwords: ${stats.casedwords}   `);
    }
    console.log(' ✅');
}
async function migrateWords(mysql) {
    console.log('📦 Migrating words...');
    const [rows] = await mysql.query('SELECT * FROM words');
    const data = rows;
    const BATCH_SIZE = 1000;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE).map(row => ({
            wordid: row.wordid,
            lemma: row.lemma,
        }));
        await prisma.word.createMany({ data: batch, skipDuplicates: true });
        stats.words += batch.length;
        process.stdout.write(`\r   Words: ${stats.words}   `);
    }
    console.log(' ✅');
}
async function migrateSynsets(mysql) {
    console.log('📦 Migrating synsets...');
    const [rows] = await mysql.query('SELECT * FROM synsets');
    const data = rows;
    const BATCH_SIZE = 1000;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE).map(row => ({
            synsetid: row.synsetid,
            pos: row.pos,
            definition: row.definition,
            lexdomainid: row.lexdomainid,
        }));
        await prisma.synset.createMany({ data: batch, skipDuplicates: true });
        stats.synsets += batch.length;
        process.stdout.write(`\r   Synsets: ${stats.synsets}   `);
    }
    console.log(' ✅');
}
async function migrateSenses(mysql) {
    console.log('📦 Migrating senses...');
    const [rows] = await mysql.query('SELECT * FROM senses');
    const data = rows;
    const BATCH_SIZE = 1000;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE).map(row => ({
            senseid: row.senseid,
            wordid: row.wordid,
            synsetid: row.synsetid,
            casedwordid: row.casedwordid || null,
            lexid: row.lexid || null,
            tagcount: row.tagcount || null,
            sensenum: row.sensenum || null,
            sensekey: row.sensekey || null,
        }));
        await prisma.sense.createMany({ data: batch, skipDuplicates: true });
        stats.senses += batch.length;
        process.stdout.write(`\r   Senses: ${stats.senses}   `);
    }
    console.log(' ✅');
}
async function migrateDifficulty(mysql) {
    console.log('📦 Migrating difficulty metrics...');
    // Check if table exists
    try {
        await mysql.query('SELECT * FROM wordigo_difficulty LIMIT 1');
    }
    catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.log('   ⚠️  Table wordigo_difficulty does not exist - skipping');
            return;
        }
        throw error;
    }
    const [rows] = await mysql.query('SELECT * FROM wordigo_difficulty');
    const data = rows;
    const BATCH_SIZE = 1000;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE).map(row => ({
            senseid: row.senseid,
            word_syllable_count: row.word_syllable_count || null,
            word_in_definition: row.word_in_definition === 1 || row.word_in_definition === true,
            def_avg_read_score: row.def_avg_read_score ? parseFloat(row.def_avg_read_score) : null,
            def_num_chars: row.def_num_chars || null,
            def_avg_read_score_band: row.def_avg_read_score_band || null,
            def_num_chars_band: row.def_num_chars_band || null,
        }));
        await prisma.wordigoDifficulty.createMany({ data: batch, skipDuplicates: true });
        stats.difficulty += batch.length;
        process.stdout.write(`\r   Difficulty: ${stats.difficulty}   `);
    }
    console.log(' ✅');
}
// New migration functions for additional tables
async function migrateLinktypes(mysql) {
    console.log('📦 Migrating linktypes...');
    const [rows] = await mysql.query('SELECT * FROM linktypes');
    const data = rows;
    await prisma.linkType.createMany({
        data: data.map(row => ({
            linkid: row.linkid,
            link: row.link,
            recurses: row.recurses === 1,
        })),
        skipDuplicates: true,
    });
    stats.linktypes = data.length;
    console.log(`   ✅ ${stats.linktypes} rows`);
}
async function migratePostypes(mysql) {
    console.log('📦 Migrating postypes...');
    const [rows] = await mysql.query('SELECT * FROM postypes');
    const data = rows;
    await prisma.posType.createMany({
        data: data.map(row => ({
            pos: row.pos,
            posname: row.posname,
        })),
        skipDuplicates: true,
    });
    stats.postypes = data.length;
    console.log(`   ✅ ${stats.postypes} rows`);
}
async function migrateAdjpositiontypes(mysql) {
    console.log('📦 Migrating adjpositiontypes...');
    const [rows] = await mysql.query('SELECT * FROM adjpositiontypes');
    const data = rows;
    await prisma.adjPositionType.createMany({
        data: data.map(row => ({
            position: row.position,
            positionname: row.positionname,
        })),
        skipDuplicates: true,
    });
    stats.adjpositiontypes = data.length;
    console.log(`   ✅ ${stats.adjpositiontypes} rows`);
}
async function migrateVframes(mysql) {
    console.log('📦 Migrating vframes...');
    const [rows] = await mysql.query('SELECT * FROM vframes');
    const data = rows;
    await prisma.vFrame.createMany({
        data: data.map(row => ({
            frameid: row.frameid,
            frame: row.frame,
        })),
        skipDuplicates: true,
    });
    stats.vframes = data.length;
    console.log(`   ✅ ${stats.vframes} rows`);
}
async function migrateVframesentences(mysql) {
    console.log('📦 Migrating vframesentences...');
    const [rows] = await mysql.query('SELECT * FROM vframesentences');
    const data = rows;
    const BATCH_SIZE = 1000;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE).map(row => ({
            sentenceid: row.sentenceid,
            sentence: row.sentence,
        }));
        await prisma.vFrameSentence.createMany({ data: batch, skipDuplicates: true });
        stats.vframesentences += batch.length;
        process.stdout.write(`\r   VFrameSentences: ${stats.vframesentences}   `);
    }
    console.log(' ✅');
}
async function migrateMorphs(mysql) {
    console.log('📦 Migrating morphs...');
    const [rows] = await mysql.query('SELECT * FROM morphs');
    const data = rows;
    const BATCH_SIZE = 1000;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE).map(row => ({
            morphid: row.morphid,
            morph: row.morph,
        }));
        await prisma.morph.createMany({ data: batch, skipDuplicates: true });
        stats.morphs += batch.length;
        process.stdout.write(`\r   Morphs: ${stats.morphs}   `);
    }
    console.log(' ✅');
}
async function migrateLexlinks(mysql) {
    console.log('📦 Migrating lexlinks...');
    const [rows] = await mysql.query('SELECT * FROM lexlinks');
    const data = rows;
    const BATCH_SIZE = 5000;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE).map(row => ({
            synset1id: row.synset1id,
            word1id: row.word1id,
            synset2id: row.synset2id,
            word2id: row.word2id,
            linkid: row.linkid,
        }));
        await prisma.lexLink.createMany({ data: batch, skipDuplicates: true });
        stats.lexlinks += batch.length;
        process.stdout.write(`\r   Lexlinks: ${stats.lexlinks}   `);
    }
    console.log(' ✅');
}
async function migrateSemlinks(mysql) {
    console.log('📦 Migrating semlinks...');
    const [rows] = await mysql.query('SELECT * FROM semlinks');
    const data = rows;
    const BATCH_SIZE = 5000;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE).map(row => ({
            synset1id: row.synset1id,
            synset2id: row.synset2id,
            linkid: row.linkid,
        }));
        await prisma.semlink.createMany({ data: batch, skipDuplicates: true });
        stats.semlinks += batch.length;
        process.stdout.write(`\r   Semlinks: ${stats.semlinks}   `);
    }
    console.log(' ✅');
}
async function migrateSamples(mysql) {
    console.log('📦 Migrating samples...');
    const [rows] = await mysql.query('SELECT * FROM samples');
    const data = rows;
    const BATCH_SIZE = 5000;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE).map(row => ({
            synsetid: row.synsetid,
            sampleid: row.sampleid,
            sample: row.sample,
        }));
        await prisma.sample.createMany({ data: batch, skipDuplicates: true });
        stats.samples += batch.length;
        process.stdout.write(`\r   Samples: ${stats.samples}   `);
    }
    console.log(' ✅');
}
async function migrateMorphmaps(mysql) {
    console.log('📦 Migrating morphmaps...');
    const [rows] = await mysql.query('SELECT * FROM morphmaps');
    const data = rows;
    const BATCH_SIZE = 5000;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE).map(row => ({
            wordid: row.wordid,
            pos: row.pos,
            morphid: row.morphid,
        }));
        await prisma.morphMap.createMany({ data: batch, skipDuplicates: true });
        stats.morphmaps += batch.length;
        process.stdout.write(`\r   Morphmaps: ${stats.morphmaps}   `);
    }
    console.log(' ✅');
}
async function migrateAdjpositions(mysql) {
    console.log('📦 Migrating adjpositions...');
    const [rows] = await mysql.query('SELECT * FROM adjpositions');
    const data = rows;
    const BATCH_SIZE = 5000;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE).map(row => ({
            synsetid: row.synsetid,
            wordid: row.wordid,
            position: row.position,
        }));
        await prisma.adjPosition.createMany({ data: batch, skipDuplicates: true });
        stats.adjpositions += batch.length;
        process.stdout.write(`\r   Adjpositions: ${stats.adjpositions}   `);
    }
    console.log(' ✅');
}
async function migrateVframemaps(mysql) {
    console.log('📦 Migrating vframemaps...');
    const [rows] = await mysql.query('SELECT * FROM vframemaps');
    const data = rows;
    const BATCH_SIZE = 5000;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE).map(row => ({
            synsetid: row.synsetid,
            wordid: row.wordid,
            frameid: row.frameid,
        }));
        await prisma.vFrameMap.createMany({ data: batch, skipDuplicates: true });
        stats.vframemaps += batch.length;
        process.stdout.write(`\r   VFramemaps: ${stats.vframemaps}   `);
    }
    console.log(' ✅');
}
async function migrateVframesentencemaps(mysql) {
    console.log('📦 Migrating vframesentencemaps...');
    const [rows] = await mysql.query('SELECT * FROM vframesentencemaps');
    const data = rows;
    const BATCH_SIZE = 5000;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE).map(row => ({
            synsetid: row.synsetid,
            wordid: row.wordid,
            sentenceid: row.sentenceid,
        }));
        await prisma.vFrameSentenceMap.createMany({ data: batch, skipDuplicates: true });
        stats.vframesentencemaps += batch.length;
        process.stdout.write(`\r   VFrameSentencemaps: ${stats.vframesentencemaps}   `);
    }
    console.log(' ✅');
}
main()
    .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=migrateFromMySQL.js.map