# Pepti Hub - E-Commerce Platform for Research Peptides

A comprehensive multi-tenant e-commerce platform built with Next.js 15, NestJS, and PostgreSQL, specifically designed for selling research peptides and related products.

## 🌟 Key Features

### Product Management
- **Complete CRUD Operations**: Full create, read, update, and delete functionality
- **Rich Product Fields**:
  - Short & Long Descriptions
  - Chemical Properties (Formula, CAS Number, Purity, Sequence)
  - Product Form (Lyophilized Powder, Liquid, Capsule, Tablet)
  - Custom Research Notices
  - Multiple Product Images with Media Library integration
- **Category Management**: Organize products into categories
- **Stock & Pricing**: Real-time inventory and pricing management

### Advanced Features
- **Media Library**: Drag-and-drop file upload with integrated media picker
- **Quality Images**: Dedicated system for displaying quality certifications
- **Product Bundles**: Create and manage product combinations
- **Shopping Cart**: Persistent cart with Zustand state management
- **Contact Management**: Admin interface for handling customer inquiries
- **Multi-tenant Architecture**: Support for multiple stores/brands

### User Experience
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern UI**: Built with Shadcn UI components
- **Fast Performance**: Server-side rendering with Next.js 15
- **Type Safety**: Full TypeScript implementation

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.5.12 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI (Radix UI primitives)
- **State Management**: Zustand
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **File Upload**: React Dropzone

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with Passport
- **Validation**: Class Validator
- **API Documentation**: Swagger/OpenAPI

##  🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/mdnishath/pepti-hub.git
cd pepti-hub
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_DEFAULT_TENANT_ID=your-tenant-id
```

4. **Start the development server**
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

The backend is included in this repository under the `backend/` directory.

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create `.env` file:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/peptihub"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development
```

4. **Run Prisma migrations**
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Seed the database (optional)**
```bash
npx prisma db seed
```

6. **Start the backend server**
```bash
npm run start:dev
```

The backend API will be available at `http://localhost:3001/api`

## 🔑 Product Fields Reference

### Core Fields
- **name**: Product name (required)
- **slug**: URL-friendly identifier (auto-generated)
- **sku**: Stock keeping unit (auto-generated if not provided)
- **price**: Product price (required)
- **stock**: Available quantity (required)
- **categoryId**: Product category (required)

### Descriptions
- **shortDescription**: Brief product summary (displayed on product card and detail page top)
- **description** (Long Description): Detailed product information (displayed in Description tab)

### Chemical Properties
- **chemicalName**: Scientific/chemical name of the peptide
- **casNumber**: CAS Registry Number
- **purity**: Purity percentage (e.g., "99%+ HPLC")
- **molecularFormula**: Chemical formula
- **sequence**: Amino acid sequence

### Additional Fields
- **productForm**: Physical form of the product
  - Options: Lyophilized Powder, Liquid, Capsule, Tablet
  - Default: "Lyophilized Powder"
- **researchNotice**: Custom research use notice (per-product)
  - Falls back to default notice if not specified
- **images**: Array of image URLs
  - Managed through Media Library or manual URL input

## 🎨 Admin Interface Features

### Product Management
1. **Create New Products**
   - Fill in all required and optional fields
   - Upload multiple images via Media Library or paste URLs
   - Preview and organize images
   - Set product form and custom research notices

2. **Edit Existing Products**
   - All fields populate automatically when editing
   - Changes save immediately to database
   - Image management with add/remove functionality

3. **Data Persistence**
   - All fields properly save to database
   - No data loss on page refresh
   - Complete save/load cycle for all product properties

## 📱 Product Detail Page

### Top Section
- Product name and chemical name
- CAS number display
- Purity and Research Use Only badges
- **Short Description** - Brief product overview
- Price and stock information
- Dynamic product form info box
- Quantity selector and Add to Cart button

### Tabs Section
1. **Chemical Properties Tab**
   - Molecular Formula
   - CAS Number
   - Purity
   - Product Form (dynamic from database)
   - Amino Acid Sequence

2. **Description Tab**
   - **Long Description** - Detailed product information

3. **Research Notice Tab**
   - Custom product-specific notice (if set)
   - Default research use notice (fallback)

## ✅ All Features Implemented

- ✅ Complete product CRUD with all fields
- ✅ Short & Long descriptions (properly labeled and positioned)
- ✅ Product Form dropdown (Lyophilized Powder, Liquid, Capsule, Tablet)
- ✅ Research Notice (dynamic per-product with fallback)
- ✅ Chemical properties (Formula, CAS#, Purity, Sequence)
- ✅ Data persistence (all fields save/load correctly)
- ✅ Product detail page (short desc in top, long desc in tabs)
- ✅ Media Library with drag-and-drop upload
- ✅ Quality Images management
- ✅ Product Bundles system
- ✅ Contact management
- ✅ Multi-tenant architecture

## 📧 Support

For support, open an issue in the GitHub repository: https://github.com/mdnishath/pepti-hub

---

**🤖 Generated with [Claude Code](https://claude.com/claude-code)**

**Co-Authored-By: Claude <noreply@anthropic.com>**
