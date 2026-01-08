const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findTops() {
  const all = await prisma.lexdomains.findMany();
  const tops = all.filter(x => x.lexdomainname.toLowerCase().includes('top'));
  tops.forEach(x => console.log(x.lexdomainname));
  await prisma.$disconnect();
}

findTops();
