import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking product stock...\n');

  // Get all products
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      stock: true,
      trackInventory: true,
      tenantId: true,
    },
  });

  console.log(`Found ${products.length} products:\n`);

  products.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name}`);
    console.log(`   Stock: ${product.stock}`);
    console.log(`   Track Inventory: ${product.trackInventory}\n`);
  });

  // Update all products to have sufficient stock
  console.log('\n✅ Setting all products to have 100 units in stock...');

  const result = await prisma.product.updateMany({
    data: {
      stock: 100,
      trackInventory: true,
    },
  });

  console.log(`✅ Updated ${result.count} products`);

  // Show updated list
  const updatedProducts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      stock: true,
      trackInventory: true,
    },
  });

  console.log('\n📊 Final stock status:');
  updatedProducts.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name} - ${product.stock} units`);
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
