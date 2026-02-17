# Implementation Roadmap

This document outlines the step-by-step process to build the Pepti-Hub application, referencing the provided design (`demo-design`) and core requirements.

## Phase 1: Environment Setup & Foundation
1.  **Initialize Next.js Project**
    -   Create new Next.js 16 app (`npx create-next-app@latest`).
    -   Configure standard directories (`src/app`, `src/components`, `src/lib`).
2.  **Install Tailwind & Shadcn/UI**
    -   Initialize Shadcn (`npx shadcn@latest init`).
    -   Configure `tailwind.config.ts` with custom colors from design (Deep Blue, etc.).
    -   Install core components (`Button`, `Sheet`, `Input`, `Select`, `Card`).
3.  **Port Design Assets**
    -   Copy `demo-design/src/index.css` (global styles/variables).
    -   Setup fonts (Inter/Outfit).
    -   Copy any svg/images from `public`.

## Phase 2: Backend Integration (WordPress/Headless)
1.  **Configure WordPress GraphQL**
    -   Install `WPGraphQL` and `WPGraphQL WooCommerce` plugins on local WP.
    -   Enable CORS settings in WP to allow `localhost:3000`.
    -   Create API client in Next.js (`lib/graphql-client.ts`).
2.  **Define GraphQL Queries**
    -   Write queries for: `GetProducts`, `GetProductBySlug`, `GetCategories`.
    -   Test queries using GraphiQL in WP Admin.

## Phase 3: Core Features Implementation
1.  **Authentication System**
    -   Implement JWT Auth provider (Context/Zustand).
    -   Create Login/Register pages.
2.  **Port React Components**
    -   Migrate `Header.tsx`, `Footer.tsx` to Next.js components.
    -   Migrate `ProductCard.tsx`, `BundleCard.tsx`.
    -   Ensure `CartDrawer.tsx` works with global state (Context).
3.  **Build Pages (App Router)**
    -   Create `/app/page.tsx` (Home).
    -   Create `/app/catalog/page.tsx` (Products List) - Connect `GetProducts` query.
    -   Create `/app/product/[slug]/page.tsx` (Detail) - Connect `GetProductBySlug`.
    -   Create Static Pages (`/contact`, `/privacy`, etc.).

## Phase 4: Cart & Checkout Logic
1.  **Cart State Management**
    -   Implement persistent cart state (LocalStorage + Context).
    -   Logic for: Add Item, Remove Item, Update Qty, Calculate Subtotal.
    -   Logic for: Volume Tiers & Free Shipping Progress.
2.  **Connect to WooCommerce**
    -   On "Checkout" click -> Create Order via API OR Redirect to WP Checkout endpoint.
    -   If Headless Checkout is required: Implement Stripe Elements (Complexity High). *Recommendation: Start with Redirect to Checkout.*

## Phase 5: Polish & Verify
1.  **Testing**
    -   Run `lint`.
    -   Verify responsiveness on mobile view.
    -   Test "Complete Flow": Register -> Browse -> Add to Cart -> Checkout.
2.  **Verification**
    -   Compare UI against `demo-design` to ensure pixel-perfect match.
    -   Check SEO tags.
