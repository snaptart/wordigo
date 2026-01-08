const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGroups() {
  const groups = await prisma.category_groups.findMany({
    select: { group_key: true, display_name: true }
  });

  console.log('\n=== Available Category Groups ===\n');
  groups.forEach(g => {
    console.log(`${g.group_key} - ${g.display_name}`);
  });

  await prisma.$disconnect();
}

checkGroups();
