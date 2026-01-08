const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyComplete() {
  // Check for any unmapped lexdomains
  const unmapped = await prisma.$queryRaw`
    SELECT
      l.lexdomainname,
      COUNT(DISTINCT s.synsetid) as synset_count
    FROM lexdomains l
    LEFT JOIN category_group_mappings cgm ON cgm.lexdomain_id = l.lexdomainid
    LEFT JOIN synsets s ON s.lexdomainid = l.lexdomainid
    WHERE cgm.group_id IS NULL
    GROUP BY l.lexdomainname
    ORDER BY synset_count DESC
  `;

  console.log('\n=== Unmapped Lexdomains ===\n');
  if (unmapped.length === 0) {
    console.log('✅ All lexdomains are now mapped to simple categories!');
  } else {
    console.log(`❌ Still have ${unmapped.length} unmapped lexdomains:`);
    unmapped.forEach(row => {
      console.log(`  ${row.lexdomainname}: ${row.synset_count} synsets`);
    });
  }

  // Get mapping summary by category
  const summary = await prisma.$queryRaw`
    SELECT
      cg.display_name as category,
      cg.icon,
      COUNT(DISTINCT cgm.lexdomain_id) as lexdomain_count,
      COUNT(DISTINCT s.synsetid) as synset_count,
      ROUND(COUNT(DISTINCT s.synsetid) * 100.0 / (SELECT COUNT(*) FROM synsets), 2) as percentage
    FROM category_groups cg
    JOIN category_group_mappings cgm ON cgm.group_id = cg.id
    JOIN lexdomains l ON l.lexdomainid = cgm.lexdomain_id
    LEFT JOIN synsets s ON s.lexdomainid = l.lexdomainid
    WHERE cg.is_active = true
    GROUP BY cg.display_name, cg.icon, cg.sort_order
    ORDER BY cg.sort_order
  `;

  console.log('\n=== Category Coverage Summary ===\n');
  let totalSynsets = 0;
  let totalLexdomains = 0;
  summary.forEach(row => {
    console.log(`${row.icon} ${row.category}`);
    console.log(`   ${row.lexdomain_count} lexdomains, ${parseInt(row.synset_count).toLocaleString()} synsets (${row.percentage}%)`);
    totalSynsets += parseInt(row.synset_count);
    totalLexdomains += parseInt(row.lexdomain_count);
  });

  console.log(`\n📊 Total: ${totalLexdomains} lexdomains mapped, ${totalSynsets.toLocaleString()} synsets covered`);

  await prisma.$disconnect();
}

verifyComplete().catch(console.error);
