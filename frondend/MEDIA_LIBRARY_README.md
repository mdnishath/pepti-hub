# Media Library System - Documentation

## Overview
Complete Media Library implementation for the e-commerce admin panel with upload, management, and selection capabilities.

## Features
- ✅ Drag-and-drop file upload
- ✅ Single and multiple file upload
- ✅ Image and video support
- ✅ Grid display with thumbnails
- ✅ Media deletion
- ✅ Tenant isolation
- ✅ File size validation (10MB limit)
- ✅ MIME type validation
- ✅ MediaPicker modal for selecting media in other pages
- ✅ Responsive design

## Backend Implementation

### Database Schema
**Model: Media** (`backend/prisma/schema.prisma`)
- `id`: Unique identifier (CUID)
- `filename`: Stored filename with timestamp
- `originalName`: Original uploaded filename
- `mimeType`: File MIME type
- `size`: File size in bytes
- `url`: Full URL path to file
- `type`: MediaType enum (IMAGE/VIDEO)
- `tenantId`: Tenant identifier for isolation
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Migration**: `20260216110002_add_media_table`

### API Endpoints

#### POST `/api/media/upload`
Upload a single media file
- **Auth**: Required (Admin/Super Admin)
- **Content-Type**: `multipart/form-data`
- **Body**: `file` (FormData)
- **Response**: Media object

#### POST `/api/media/upload-multiple`
Upload multiple media files
- **Auth**: Required (Admin/Super Admin)
- **Content-Type**: `multipart/form-data`
- **Body**: `files[]` (FormData array)
- **Response**: Array of Media objects

#### GET `/api/media`
Get all media files
- **Auth**: Required (Admin/Super Admin)
- **Query Params**: `type` (optional: IMAGE/VIDEO)
- **Response**: Array of Media objects

#### GET `/api/media/:id`
Get single media file by ID
- **Auth**: Required (Admin/Super Admin)
- **Response**: Media object

#### DELETE `/api/media/:id`
Delete media file
- **Auth**: Required (Admin/Super Admin)
- **Response**: Success message

### File Storage
- **Location**: `backend/uploads/{tenantId}/`
- **Naming**: `{fieldname}-{timestamp}-{random}.{ext}`
- **Tenant Isolation**: Each tenant has separate folder
- **Size Limit**: 10MB per file
- **Allowed Types**:
  - Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`
  - Videos: `.mp4`, `.mpeg`, `.webm`, `.mov`

### Static File Serving
Files are served via Express static middleware:
- **URL Pattern**: `http://localhost:3001/uploads/{tenantId}/{filename}`
- **Configuration**: `backend/src/main.ts`

## Frontend Implementation

### Pages

#### Media Library Page
**Location**: `app/admin/media/page.tsx`

Features:
- Drag-and-drop upload zone
- Filter by type (All/Images/Videos)
- Grid display with thumbnails
- Delete confirmation dialog
- Loading and empty states
- Real-time updates after upload

### Components

#### MediaPicker
**Location**: `components/admin/MediaPicker.tsx`

Reusable modal component for selecting media in other pages.

**Props**:
```typescript
interface MediaPickerProps {
  open: boolean;                  // Control modal visibility
  onOpenChange: (open: boolean) => void;  // Handle modal close
  onSelect: (media: Media | Media[]) => void;  // Handle selection
  multiple?: boolean;             // Allow multiple selection (default: false)
  type?: "IMAGE" | "VIDEO" | "ALL";  // Filter media type (default: "ALL")
}
```

**Usage Example**:
```tsx
import { MediaPicker } from "@/components/admin/MediaPicker";
import { Media } from "@/lib/api";

const [pickerOpen, setPickerOpen] = useState(false);
const [selectedImage, setSelectedImage] = useState<Media | null>(null);

const handleSelect = (media: Media | Media[]) => {
  if (!Array.isArray(media)) {
    setSelectedImage(media);
    // Use media.url in your form
  }
};

<Button onClick={() => setPickerOpen(true)}>
  Select Image
</Button>

<MediaPicker
  open={pickerOpen}
  onOpenChange={setPickerOpen}
  onSelect={handleSelect}
  multiple={false}
  type="IMAGE"
/>
```

### API Client
**Location**: `lib/api.ts`

```typescript
// Types
export interface Media {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// API Methods
mediaAPI.getAll(type?: MediaFileType): Promise<Media[]>
mediaAPI.getById(id: string): Promise<Media>
mediaAPI.upload(file: File): Promise<Media>
mediaAPI.uploadMultiple(files: File[]): Promise<Media[]>
mediaAPI.delete(id: string): Promise<void>
```

### Navigation
Added to AdminLayout sidebar:
- **Icon**: Image (from lucide-react)
- **Route**: `/admin/media`
- **Position**: Between Categories and Settings

## Integration Guide

### Using MediaPicker in Product Form

```tsx
"use client";

import { useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { Media } from "@/lib/api";

export default function ProductForm() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    thumbnail: "",
    images: [],
  });

  // For thumbnail (single image)
  const handleThumbnailSelect = (media: Media | Media[]) => {
    if (!Array.isArray(media)) {
      setFormData(prev => ({
        ...prev,
        thumbnail: media.url
      }));
      setPickerOpen(false);
    }
  };

  // For product images (multiple)
  const handleImagesSelect = (media: Media | Media[]) => {
    if (Array.isArray(media)) {
      setFormData(prev => ({
        ...prev,
        images: media.map(m => m.url)
      }));
      setPickerOpen(false);
    }
  };

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  return (
    <div>
      {/* Thumbnail Picker */}
      <div>
        <label>Thumbnail</label>
        <Button onClick={() => setPickerOpen(true)}>
          Select Thumbnail
        </Button>
        {formData.thumbnail && (
          <img
            src={`${API_BASE_URL}${formData.thumbnail}`}
            alt="Thumbnail"
            className="w-32 h-32 object-cover"
          />
        )}
      </div>

      {/* Multiple Images Picker */}
      <div>
        <label>Product Images</label>
        <Button onClick={() => setPickerOpen(true)}>
          Select Images
        </Button>
        <div className="grid grid-cols-4 gap-2">
          {formData.images.map((url, idx) => (
            <img
              key={idx}
              src={`${API_BASE_URL}${url}`}
              alt={`Product ${idx + 1}`}
              className="w-full h-32 object-cover"
            />
          ))}
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleThumbnailSelect}
        multiple={false}
        type="IMAGE"
      />
    </div>
  );
}
```

## File Structure

```
backend/
├── prisma/
│   ├── schema.prisma                    # Media model definition
│   └── migrations/
│       └── 20260216110002_add_media_table/  # Media table migration
├── src/
│   ├── media/
│   │   ├── dto/
│   │   │   └── create-media.dto.ts      # Media DTOs
│   │   ├── media.controller.ts          # Media endpoints
│   │   ├── media.service.ts             # Media business logic
│   │   └── media.module.ts              # Media module
│   ├── main.ts                          # Static file serving config
│   └── app.module.ts                    # MediaModule import
└── uploads/                             # File storage directory
    └── {tenantId}/                      # Tenant-specific folders

frontend/
├── app/
│   └── admin/
│       └── media/
│           └── page.tsx                 # Media Library page
├── components/
│   └── admin/
│       ├── MediaPicker.tsx              # Reusable picker component
│       ├── MediaPickerExample.tsx       # Usage examples
│       └── AdminLayout.tsx              # Updated with Media link
└── lib/
    └── api.ts                           # Media API client
```

## Dependencies

### Backend
- `@nestjs/platform-express` (already installed)
- `multer` - File upload middleware
- `@types/multer` - TypeScript types

### Frontend
- `react-dropzone` - Drag-and-drop functionality
- Existing shadcn/ui components (Dialog, Button, Card, etc.)

## Environment Variables

No additional environment variables required. Uses existing:
- `DATABASE_URL` - PostgreSQL connection
- `NEXT_PUBLIC_API_URL` - API base URL (defaults to http://localhost:3001)

## Security Features

1. **Authentication**: All endpoints require JWT authentication
2. **Authorization**: Only Admin and Super Admin can access
3. **Tenant Isolation**: Files stored in tenant-specific folders
4. **File Validation**:
   - MIME type checking
   - File size limits (10MB)
   - Allowed extensions only
5. **File Deletion**: Removes both DB record and physical file

## Testing

### Test File Upload
1. Start backend: `cd backend && npm run start:dev`
2. Start frontend: `npm run dev`
3. Login as admin
4. Navigate to Media Library
5. Drag and drop image/video or click to select
6. Verify upload appears in grid

### Test MediaPicker
1. Create a test page using MediaPickerExample.tsx
2. Click "Select Image" button
3. Choose media from picker
4. Verify selected media displays
5. Test both single and multiple selection modes

## Known Limitations

1. **Video Thumbnails**: Videos show placeholder icon, no thumbnail generation yet
2. **File Preview**: Videos cannot be previewed in grid (would need video player)
3. **Bulk Operations**: No bulk delete functionality yet
4. **Search/Filter**: No search by filename yet
5. **Pagination**: Shows all media (may need pagination for large libraries)

## Future Enhancements

- [ ] Video thumbnail generation
- [ ] Image optimization/resizing on upload
- [ ] Bulk delete selection
- [ ] Search and advanced filtering
- [ ] Pagination for large media libraries
- [ ] CDN integration
- [ ] Image editing capabilities
- [ ] Folder organization
- [ ] Media usage tracking (which products use which media)
- [ ] Duplicate detection

## Troubleshooting

### Files not uploading
- Check tenant ID header is being sent
- Verify uploads directory exists and has write permissions
- Check file size is under 10MB
- Verify file type is in allowed list

### Images not displaying
- Verify backend static file serving is configured
- Check API_BASE_URL is correct
- Ensure uploads directory is accessible
- Check browser console for 404 errors

### Prisma client errors
- Run `npx prisma generate` in backend directory
- Restart backend server

## Support

For issues or questions, check:
1. Backend logs: `backend/src/main.ts` console output
2. Frontend console: Browser DevTools
3. Database: Verify media table exists
4. File system: Check uploads directory structure
