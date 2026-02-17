-- CreateTable
CREATE TABLE "bundles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "discount" DECIMAL(5,2) NOT NULL,
    "originalPrice" DECIMAL(10,2) NOT NULL,
    "finalPrice" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_products" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "bundle_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_images" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bundles_tenantId_idx" ON "bundles"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "bundles_slug_tenantId_key" ON "bundles"("slug", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_products_bundleId_productId_key" ON "bundle_products"("bundleId", "productId");

-- CreateIndex
CREATE INDEX "quality_images_tenantId_idx" ON "quality_images"("tenantId");

-- CreateIndex
CREATE INDEX "quality_images_order_idx" ON "quality_images"("order");

-- AddForeignKey
ALTER TABLE "bundles" ADD CONSTRAINT "bundles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_products" ADD CONSTRAINT "bundle_products_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_products" ADD CONSTRAINT "bundle_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_images" ADD CONSTRAINT "quality_images_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
