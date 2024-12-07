const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const categories = [
  {
    name: 'Lukisan dan Ilustrasi'
  },
  {
    name: 'Seni Tiga Dimensi dan Patung'
  },
  {
    name: 'Kerajinan Tangan dan Kain Tradisional'
  },
  {
    name: 'Fotografi dan Seni Digital'
  },
  {
    name: 'Seni Tradisional dan Budaya'
  }
];

async function main() {
  console.log('Start seeding categories...');
  
  for (const category of categories) {
    const createdCategory = await prisma.category.create({
      data: category
    });
    console.log(`Created category: ${createdCategory.name}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });