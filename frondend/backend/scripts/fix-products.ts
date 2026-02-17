import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking products...\n');

  // Get all products
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      isActive: true,
      tenantId: true,
    },
  });

  console.log(`Found ${products.length} products:\n`);

  products.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name}`);
    console.log(`   ID: ${product.id}`);
    console.log(`   Active: ${product.isActive}`);
    console.log(`   TenantID: ${product.tenantId}\n`);
  });

  // Update all inactive products to be active
  const inactiveProducts = products.filter(p => !p.isActive);

  if (inactiveProducts.length > 0) {
    console.log(`\n✅ Activating ${inactiveProducts.length} inactive products...`);

    const result = await prisma.product.updateMany({
      where: {
        isActive: false,
      },
      data: {
        isActive: true,
      },
    });

    console.log(`✅ Updated ${result.count} products to active`);
  } else {
    console.log('✅ All products are already active!');
  }

  // Show updated list
  const updatedProducts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  });

  console.log('\n📊 Final product status:');
  updatedProducts.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name} - ${product.isActive ? '✅ Active' : '❌ Inactive'}`);
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
