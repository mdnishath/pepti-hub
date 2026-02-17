# ✅ Completed: Database Schema & Migration

## What's Done:
- ✅ Bundle model added to schema
- ✅ BundleProduct model added
- ✅ QualityImage model added
- ✅ Relations added to Tenant and Product models
- ✅ Migration successful - Tables created in database

## Next Steps (In Order):

### STEP 1: Quality Images Backend (~30 min)
Create folder: `E:/backend/src/quality-images/`
Files needed:
1. `quality-images.module.ts`
2. `quality-images.controller.ts`
3. `quality-images.service.ts`
4. `dto/create-quality-image.dto.ts`
5. `dto/update-quality-image.dto.ts`

Copy structure from `E:/backend/src/products/` - Same CRUD pattern

### STEP 2: Bundles Backend (~45 min)
Create folder: `E:/backend/src/bundles/`
Files needed:
1. `bundles.module.ts`
2. `bundles.controller.ts`
3. `bundles.service.ts` (complex - needs to handle products relation)
4. `dto/create-bundle.dto.ts`
5. `dto/update-bundle.dto.ts`

### STEP 3: Register Modules in App Module
Update `E:/backend/src/app.module.ts`:
```typescript
import { QualityImagesModule } from './quality-images/quality-images.module';
import { BundlesModule } from './bundles/bundles.module';

@Module({
  imports: [
    // ... existing modules
    QualityImagesModule,
    BundlesModule,
  ],
})
```

### STEP 4: Frontend API Types & Functions
Update `e:/pepti-hub/lib/api.ts`:
- Add Bundle interface
- Add BundleProduct interface
- Add QualityImage interface
- Add bundlesAPI functions
- Add qualityImagesAPI functions

### STEP 5: Admin Quality Images Page
Create `e:/pepti-hub/app/admin/quality-images/page.tsx`
Features:
- List quality images
- Upload new image
- Set title, description, order
- Delete images
- Reorder (up/down buttons)

### STEP 6: Admin Bundles Page
Create `e:/pepti-hub/app/admin/bundles/page.tsx`
Features:
- List bundles
- Create bundle (select products, set discount)
- Edit bundle
- Delete bundle
- Calculate pricing automatically

### STEP 7: Update Quality Page
Update `e:/pepti-hub/app/quality/page.tsx`:
- Remove demo COA data
- Fetch real images from qualityImagesAPI
- Display fetched images

### STEP 8: Update Homepage
Update `e:/pepti-hub/app/page.tsx`:
- Remove demo bundle data
- Fetch real bundles from bundlesAPI
- Display fetched bundles

### STEP 9: Polish Catalog Page
Update `e:/pepti-hub/app/catalog/page.tsx`:
- Already working, just needs minor polish
- Add loading states
- Add empty states

## Quick Commands for Next Session:

```bash
# Start backend
cd E:/backend
npm run start:dev

# Start frontend (in another terminal)
cd E:/pepti-hub
npm run dev
```

## For Next Session, Say ONE of:

1. **"Quality Images backend module banao"** - Creates backend API
2. **"Bundles backend module banao"** - Creates backend API
3. **"Quality Images admin page banao"** - Creates admin UI
4. **"Bundles admin page banao"** - Creates admin UI
5. **"Homepage bundles update koro"** - Updates homepage
6. **"Quality page update koro"** - Updates quality page

OR say **"Sobgula complete koro"** to do all remaining steps!

## Estimated Time:
- Backend modules: ~1.5 hours
- Admin pages: ~2 hours
- Frontend updates: ~30 minutes
**Total: ~4 hours** (across 2-3 sessions)
