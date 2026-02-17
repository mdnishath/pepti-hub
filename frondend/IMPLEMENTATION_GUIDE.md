# Complete Implementation Guide
## Catalog Page, Bundle & Save System, Quality Images Management

---

## 📋 Current Status

### ✅ Already Implemented:
- Email notification system (contact + order notifications)
- Admin settings with 2 separate notification emails
- Checkout page infinite loop fixed
- Dialog accessibility warning fixed

### 🔨 To Implement (This Guide):
1. **Bundle & Save System** - Create bundles of products with discounts
2. **Quality Images Management** - Admin page to manage quality certificate images
3. **Catalog Page Enhancement** - Use real backend products (already working, needs polish)

---

## 🎯 Part 1: Bundle & Save System

### Step 1.1: Database Schema

Add to `E:/backend/prisma/schema.prisma`:

**In Product model (after line 110, after `orderItems` relation):**
```prisma
bundleProducts BundleProduct[]
```

**In Tenant model (after line 311, after `media` relation):**
```prisma
bundles Bundle[]
```

**At the end of file (after Contact model):**
```prisma
// ==================== BUNDLES ====================
model Bundle {
  id            String          @id @default(cuid())
  name          String
  slug          String
  description   String?         @db.Text
  image         String?
  discount      Decimal         @db.Decimal(5, 2) // Percentage (e.g., 12.00 for 12%)

  // Products in bundle
  products      BundleProduct[]

  // Pricing
  originalPrice Decimal         @db.Decimal(10, 2)
  finalPrice    Decimal         @db.Decimal(10, 2)

  // Status
  isActive      Boolean         @default(true)

  // White-label
  tenantId      String
  tenant        Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Timestamps
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@unique([slug, tenantId])
  @@index([tenantId])
  @@map("bundles")
}

model BundleProduct {
  id        String  @id @default(cuid())
  bundle    Bundle  @relation(fields: [bundleId], references: [id], onDelete: Cascade)
  bundleId  String
  product   Product @relation(fields: [productId], references: [id])
  productId String
  quantity  Int     @default(1)

  @@unique([bundleId, productId])
  @@map("bundle_products")
}
```

### Step 1.2: Run Migration

```bash
cd E:/backend
npx prisma migrate dev --name add_bundles_system
```

### Step 1.3: Create Backend Module

Create folder: `E:/backend/src/bundles/`

**Files to create:**

1. `bundles.module.ts`
2. `bundles.controller.ts`
3. `bundles.service.ts`
4. `dto/create-bundle.dto.ts`
5. `dto/update-bundle.dto.ts`

Use Products module as reference (similar structure).

### Step 1.4: Seed Sample Bundles

Add to `E:/backend/prisma/seed.ts` to create sample bundles like:
- Recovery Stack (BPC-157 + TB-500)
- Growth Stack (CJC-1295 + Ipamorelin)
- Immune Defense Stack (Thymosin Alpha-1 + LL-37)

### Step 1.5: Frontend API

Add to `e:/pepti-hub/lib/api.ts`:

```typescript
export interface Bundle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  discount: number;
  originalPrice: number;
  finalPrice: number;
  products: BundleProduct[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BundleProduct {
  id: string;
  product: Product;
  quantity: number;
}

export const bundlesAPI = {
  getAll: async (): Promise<Bundle[]> => {
    const response = await api.get('/bundles');
    return response.data;
  },
  // ... other CRUD methods
};
```

### Step 1.6: Admin Bundles Page

Create `e:/pepti-hub/app/admin/bundles/page.tsx`

Features:
- List all bundles
- Create new bundle (select products, set discount)
- Edit bundle
- Delete bundle
- Toggle active status

Use Products admin page as reference.

### Step 1.7: Update Homepage

Update `e:/pepti-hub/app/page.tsx`:

Replace demo bundle data with real API call:
```typescript
const [bundles, setBundles] = useState<Bundle[]>([]);

useEffect(() => {
  const fetchBundles = async () => {
    const data = await bundlesAPI.getAll();
    setBundles(data.filter(b => b.isActive));
  };
  fetchBundles();
}, []);
```

---

## 🎯 Part 2: Quality Images Management

### Step 2.1: Database Schema

Add to `E:/backend/prisma/schema.prisma`:

**In Tenant model (after `bundles` relation):**
```prisma
qualityImages QualityImage[]
```

**At the end of file:**
```prisma
// ==================== QUALITY IMAGES ====================
model QualityImage {
  id          String   @id @default(cuid())
  title       String
  description String?  @db.Text
  imageUrl    String
  order       Int      @default(0)
  isActive    Boolean  @default(true)

  // White-label
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
  @@index([order])
  @@map("quality_images")
}
```

### Step 2.2: Run Migration

```bash
cd E:/backend
npx prisma migrate dev --name add_quality_images
```

### Step 2.3: Create Backend Module

Create folder: `E:/backend/src/quality-images/`

**Files to create:**

1. `quality-images.module.ts`
2. `quality-images.controller.ts`
3. `quality-images.service.ts`
4. `dto/create-quality-image.dto.ts`
5. `dto/update-quality-image.dto.ts`

### Step 2.4: Frontend API

Add to `e:/pepti-hub/lib/api.ts`:

```typescript
export interface QualityImage {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const qualityImagesAPI = {
  getAll: async (): Promise<QualityImage[]> => {
    const response = await api.get('/quality-images');
    return response.data;
  },
  // ... other CRUD methods
};
```

### Step 2.5: Admin Quality Images Page

Create `e:/pepti-hub/app/admin/quality-images/page.tsx`

Features:
- List all quality images
- Upload new image (use existing media upload)
- Set title, description, order
- Reorder images (drag & drop or up/down buttons)
- Delete images
- Toggle active status

### Step 2.6: Update Quality Page

Update `e:/pepti-hub/app/quality/page.tsx`:

Remove demo COA data, fetch from backend:
```typescript
const [qualityImages, setQualityImages] = useState<QualityImage[]>([]);

useEffect(() => {
  const fetchImages = async () => {
    const data = await qualityImagesAPI.getAll();
    setQualityImages(data.filter(img => img.isActive).sort((a, b) => a.order - b.order));
  };
  fetchImages();
}, []);
```

---

## 🎯 Part 3: Catalog Page Enhancement

### Current Status:
✅ Already fetching real products from backend
✅ Category filter working
🔧 Just needs UI polish

### What to do:

Update `e:/pepti-hub/app/catalog/page.tsx`:

1. Remove any demo/hardcoded products
2. Ensure category filter is working properly
3. Add loading states
4. Add empty states
5. Polish the product grid layout

The backend already has:
- Products API ✅
- Categories API ✅
- Filter by category ✅

---

## 📝 Implementation Order (Recommended)

For next session, implement in this order:

### Session 1: Quality Images (Easiest - ~1 hour)
1. ✅ Add QualityImage model to schema
2. ✅ Run migration
3. ✅ Create backend module
4. ✅ Create admin page
5. ✅ Update quality page

### Session 2: Bundle System (Complex - ~2-3 hours)
1. ✅ Add Bundle models to schema
2. ✅ Run migration
3. ✅ Create backend module with complex logic
4. ✅ Seed sample bundles
5. ✅ Create admin page
6. ✅ Update homepage

### Session 3: Polish (Final touches - ~30 min)
1. ✅ Polish catalog page
2. ✅ Test everything
3. ✅ Fix any bugs

---

## 🚀 Quick Start Commands for Next Session

```bash
# Start backend
cd E:/backend
npm run start:dev

# In another terminal, start frontend
cd E:/pepti-hub
npm run dev

# When ready to add schemas and migrate:
cd E:/backend
# Edit prisma/schema.prisma (follow guide above)
npx prisma migrate dev --name add_bundles_and_quality_images
npx prisma generate
```

---

## 📞 For Next Session, Say:

**Option 1 (Recommended):** "Quality Images system implement koro"
**Option 2:** "Bundle system implement koro"
**Option 3:** "Sobgula eksathe implement koro" (will do both in sequence)

---

## ✅ Success Criteria

When everything is complete, you should have:

1. ✅ Admin can create/edit/delete bundles
2. ✅ Homepage shows real bundles from database with discount badges
3. ✅ Admin can upload/manage quality certificate images
4. ✅ Quality page shows real images from database
5. ✅ Catalog page uses real products with working filters
6. ✅ All features work with multi-tenant system

---

**End of Implementation Guide**

Save this file for reference in next session! 🎯
