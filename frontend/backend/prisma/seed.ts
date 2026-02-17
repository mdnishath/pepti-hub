import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'pepti-hub' },
    update: {},
    create: {
      id: 'pepti-hub',
      name: 'Pepti Hub',
      slug: 'pepti-hub',
      domain: 'localhost',
      email: 'admin@peptihub.com',
      phone: '+880123456789',
      address: 'Dhaka, Bangladesh',
      currency: 'BDT',
      taxRate: 0.0,
      isActive: true,
    },
  });

  console.log('✅ Default tenant created:', tenant);

  // Create SUPER_ADMIN user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const superAdmin = await prisma.user.upsert({
    where: {
      email_tenantId: {
        email: 'admin@peptihub.com',
        tenantId: 'pepti-hub'
      }
    },
    update: {},
    create: {
      email: 'admin@peptihub.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      tenantId: 'pepti-hub',
      isActive: true,
    },
  });

  console.log('✅ Super Admin created:', {
    email: superAdmin.email,
    role: superAdmin.role,
  });

  // Create default categories
  const categories = [
    { name: 'General', slug: 'general', description: 'General products' },
    { name: 'Peptides', slug: 'peptides', description: 'Peptide products' },
    { name: 'Supplements', slug: 'supplements', description: 'Supplement products' },
    { name: 'Research', slug: 'research', description: 'Research chemicals' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        slug_tenantId: {
          slug: category.slug,
          tenantId: 'pepti-hub',
        },
      },
      update: {},
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        tenantId: 'pepti-hub',
      },
    });
  }

  console.log('✅ Default categories created:', categories.length);

  console.log('🎉 Database seeding completed!');
  console.log('');
  console.log('🔑 Super Admin Credentials:');
  console.log('   Email: admin@peptihub.com');
  console.log('   Password: admin123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
