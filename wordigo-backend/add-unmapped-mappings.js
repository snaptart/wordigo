const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMappings() {
  try {
    // Get category group IDs
    const actions = await prisma.category_groups.findUnique({ where: { group_key: 'actions_events' } });
    const thinking = await prisma.category_groups.findUnique({ where: { group_key: 'thinking_knowledge' } });
    const nature = await prisma.category_groups.findUnique({ where: { group_key: 'nature_living' } });
    const materials = await prisma.category_groups.findUnique({ where: { group_key: 'materials_substances' } });
    const qualities = await prisma.category_groups.findUnique({ where: { group_key: 'qualities_attributes' } });

    // Define mappings
    const mappings = [
      { lexdomain: 'noun.tops', groupId: materials.id, groupName: 'Materials & Substances' },
      { lexdomain: 'noun.shape', groupId: qualities.id, groupName: 'Qualities & Attributes' },
      { lexdomain: 'noun.motive', groupId: thinking.id, groupName: 'Thinking & Knowledge' },
      { lexdomain: 'noun.linkdef', groupId: thinking.id, groupName: 'Thinking & Knowledge' },
      { lexdomain: 'verb.stative', groupId: qualities.id, groupName: 'Qualities & Attributes' },
      { lexdomain: 'verb.emotion', groupId: thinking.id, groupName: 'Thinking & Knowledge' },
      { lexdomain: 'verb.weather', groupId: nature.id, groupName: 'Nature & Living Things' },
      { lexdomain: 'adj.ppl', groupId: qualities.id, groupName: 'Qualities & Attributes' }
    ];

    console.log('\n=== Adding Unmapped Lexdomain Mappings ===\n');

    let added = 0;
    for (const mapping of mappings) {
      const lexdomain = await prisma.lexdomains.findFirst({
        where: { lexdomainname: mapping.lexdomain }
      });

      if (!lexdomain) {
        console.log(`❌ Lexdomain not found: ${mapping.lexdomain}`);
        continue;
      }

      try {
        await prisma.category_group_mappings.create({
          data: {
            group_id: mapping.groupId,
            lexdomain_id: lexdomain.lexdomainid
          }
        });
        console.log(`✅ ${mapping.lexdomain} -> ${mapping.groupName}`);
        added++;
      } catch (e) {
        if (e.code === 'P2002') {
          console.log(`⚠️  ${mapping.lexdomain} already mapped to ${mapping.groupName}`);
        } else {
          throw e;
        }
      }
    }

    console.log(`\n✅ Successfully added ${added} new mappings`);

    // Verify the mappings
    console.log('\n=== Verifying Mappings ===\n');
    const result = await prisma.$queryRaw`
      SELECT
        cg.display_name as category,
        l.lexdomainname,
        COUNT(DISTINCT s.synsetid) as synset_count
      FROM category_group_mappings cgm
      JOIN category_groups cg ON cg.id = cgm.group_id
      JOIN lexdomains l ON l.lexdomainid = cgm.lexdomain_id
      LEFT JOIN synsets s ON s.lexdomainid = l.lexdomainid
      WHERE l.lexdomainname IN (
        'noun.tops', 'noun.shape', 'noun.motive', 'noun.linkdef',
        'verb.stative', 'verb.emotion', 'verb.weather', 'adj.ppl'
      )
      GROUP BY cg.display_name, l.lexdomainname
      ORDER BY cg.display_name, synset_count DESC
    `;

    result.forEach(row => {
      console.log(`${row.category}: ${row.lexdomainname} (${row.synset_count} synsets)`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

addMappings();
