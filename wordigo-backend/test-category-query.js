const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getWordsByCategory(categoryKey, lexdomainName = null, limit = 20) {
  const query = `
    SELECT
      cg.display_name as simple_category,
      cg.icon,
      l.lexdomainname as lexdomain,
      w.lemma,
      s.definition,
      s.synsetid,
      COUNT(DISTINCT se.senseid) as sense_count
    FROM category_groups cg
    JOIN category_group_mappings cgm ON cgm.group_id = cg.id
    JOIN lexdomains l ON l.lexdomainid = cgm.lexdomain_id
    JOIN synsets s ON s.lexdomainid = l.lexdomainid
    JOIN senses se ON se.synsetid = s.synsetid
    JOIN words w ON w.wordid = se.wordid
    WHERE
      cg.group_key = $1
      ${lexdomainName ? 'AND l.lexdomainname = $2' : ''}
    GROUP BY cg.display_name, cg.icon, l.lexdomainname, w.lemma, s.definition, s.synsetid
    ORDER BY w.lemma, s.synsetid
    LIMIT ${limit}
  `;

  const params = lexdomainName ? [categoryKey, lexdomainName] : [categoryKey];
  const results = await prisma.$queryRawUnsafe(query, ...params);

  return results;
}

async function demonstrateQuery() {
  console.log('\n=== Example 1: Materials & Substances -> noun.tops ===\n');
  const example1 = await getWordsByCategory('materials_substances', 'noun.tops', 15);
  example1.forEach(row => {
    console.log(`${row.icon} ${row.simple_category} > ${row.lexdomain}`);
    console.log(`   "${row.lemma}" - ${row.definition}`);
    console.log(`   (synset: ${row.synsetid}, senses: ${row.sense_count})\n`);
  });

  console.log('\n=== Example 2: Thinking & Knowledge -> verb.emotion ===\n');
  const example2 = await getWordsByCategory('thinking_knowledge', 'verb.emotion', 15);
  example2.forEach(row => {
    console.log(`${row.icon} ${row.simple_category} > ${row.lexdomain}`);
    console.log(`   "${row.lemma}" - ${row.definition}`);
    console.log(`   (synset: ${row.synsetid})\n`);
  });

  console.log('\n=== Example 3: All words in Nature & Living Things (first 10) ===\n');
  const example3 = await getWordsByCategory('nature_living', null, 10);
  example3.forEach(row => {
    console.log(`${row.icon} ${row.simple_category} > ${row.lexdomain}`);
    console.log(`   "${row.lemma}" - ${row.definition}\n`);
  });

  await prisma.$disconnect();
}

demonstrateQuery().catch(console.error);
