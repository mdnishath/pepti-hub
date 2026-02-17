# Pepti-Hub Implementation Strategy
## Final Architecture & Migration Plan

---

## 📋 Executive Summary

After analyzing the complete documentation and existing demo-design (built with Lovable/Vite+React), this document outlines the **best implementation approach** for Pepti-Hub e-commerce platform.

### Current State
- **Demo Design**: Vite + React 18 + TypeScript + Shadcn/UI + Tailwind CSS
- **Architecture**: Client-side routing (React Router), Context API for state
- **Status**: Full UI/UX complete with all components, pages, and styling

### Target State
- **Production App**: Next.js 15+ (App Router) + WordPress Headless CMS + WooCommerce
- **Architecture**: SSR/SSG hybrid, API routes, optimized for SEO and performance
- **Integration**: Real WooCommerce data replacing mock data

---

## 🎯 Recommended Implementation Path

### **Option A: Gradual Migration (RECOMMENDED)**
Port the existing demo-design to Next.js while maintaining UI fidelity, then integrate WordPress/WooCommerce backend.

**Pros:**
- Preserve proven UI/UX from demo-design
- Gradual migration reduces risk
- Can test each component during migration
- Easier debugging and validation

**Timeline:** 3-4 weeks

### **Option B: Fresh Next.js Build**
Start from scratch with Next.js and reference demo-design for styling.

**Pros:**
- Clean architecture from start
- No legacy code concerns

**Cons:**
- Higher risk of UI inconsistencies
- Longer development time
- Need to reimplement all features

**Timeline:** 5-6 weeks

**✅ DECISION: We will use Option A (Gradual Migration)**

---

## 🏗️ Architecture Comparison

### Demo Design (Current)
```
demo-design/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ProductCard.tsx
│   │   ├── CartDrawer.tsx
│   │   └── ui/              # Shadcn components
│   ├── pages/               # Route pages (React Router)
│   │   ├── Index.tsx
│   │   ├── Catalog.tsx
│   │   ├── ProductDetail.tsx
│   │   └── Account.tsx
│   ├── context/             # Global state management
│   │   ├── CartContext.tsx
│   │   └── AuthContext.tsx
│   ├── data/
│   │   └── products.ts      # Mock product data
│   ├── types/
│   │   └── product.ts
│   └── App.tsx              # Router setup
├── public/
│   └── images/
└── package.json
```

### Next.js Production (Target)
```
pepti-hub-nextjs/
├── src/
│   ├── app/                 # App Router (Next.js 15+)
│   │   ├── layout.tsx
│   │   ├── page.tsx         # Home page (/)
│   │   ├── catalog/
│   │   │   └── page.tsx
│   │   ├── product/
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── account/
│   │   │   ├── page.tsx
│   │   │   └── dashboard/
│   │   │       └── page.tsx
│   │   └── api/             # API routes
│   │       ├── cart/
│   │       └── auth/
│   ├── components/          # Same structure as demo
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ProductCard.tsx
│   │   └── ui/
│   ├── lib/
│   │   ├── wordpress/       # WordPress API client
│   │   │   ├── graphql.ts
│   │   │   └── queries.ts
│   │   ├── woocommerce/     # WooCommerce integration
│   │   │   ├── cart.ts
│   │   │   └── checkout.ts
│   │   └── utils.ts
│   ├── store/               # Zustand stores (replacing Context)
│   │   ├── cart-store.ts
│   │   └── auth-store.ts
│   ├── types/
│   │   ├── product.ts
│   │   └── wordpress.ts
│   └── styles/
│       └── globals.css      # Port from demo's index.css
├── public/
│   └── images/
└── package.json
```

---

## 📦 Technology Stack (Final)

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.1+ | React framework with App Router |
| **React** | 19+ | UI library |
| **TypeScript** | 5.8+ | Type safety |
| **Tailwind CSS** | 3.4+ | Styling (same as demo) |
| **Shadcn/UI** | Latest | Component library |
| **Zustand** | 5+ | State management (lightweight) |
| **TanStack Query** | 5+ | Server state & caching |
| **Zod** | 3+ | Schema validation |
| **React Hook Form** | 7+ | Form handling |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **WordPress** | 6.4+ | Headless CMS |
| **WooCommerce** | 8+ | E-commerce engine |
| **WPGraphQL** | 1.26+ | GraphQL API |
| **WPGraphQL WooCommerce** | Latest | WC data exposure |
| **JWT Authentication** | Latest | Token-based auth |

### Infrastructure
- **Frontend Hosting**: Vercel (optimized for Next.js)
- **Backend Hosting**: VPS (DigitalOcean/AWS) or WordPress.com Business
- **Database**: MySQL 8.0+ (WordPress requirement)
- **CDN**: Cloudflare or Vercel Edge Network

---

## 🚀 Implementation Phases

### **Phase 1: Foundation Setup (Week 1)**

#### 1.1 Next.js Project Initialization
```bash
npx create-next-app@latest pepti-hub-nextjs
# Select: TypeScript, App Router, Tailwind CSS, src/ directory
```

**Tasks:**
- ✅ Initialize Next.js 15+ with App Router
- ✅ Configure TypeScript with strict mode
- ✅ Setup Tailwind CSS with custom config
- ✅ Install and configure Shadcn/UI
- ✅ Port `tailwind.config.ts` from demo-design
- ✅ Port `globals.css` (from demo's `index.css`)
- ✅ Setup project structure (lib, components, types)

#### 1.2 Design System Migration
**Copy from demo-design:**
- `src/components/ui/*` → Same structure in Next.js
- Color variables and theme configuration
- Custom fonts (Inter from Google Fonts)
- All Shadcn components used in demo

**Validation:**
- Run Storybook (optional) to verify component library
- Test dark mode toggle
- Verify responsive breakpoints

---

### **Phase 2: Core Components Migration (Week 1-2)**

#### 2.1 Layout Components
**Priority Order:**
1. **Header.tsx** (Complex - search, cart, mobile nav)
   - Keep all functionality intact
   - Adapt `useNavigate` → Next.js `useRouter`
   - Adapt `Link` from react-router → next/link
   - Keep search modal logic exactly as-is

2. **Footer.tsx**
   - Simple component, direct port

3. **Layout.tsx**
   - Convert to Next.js `layout.tsx` in app/
   - Integrate with Next.js metadata API

#### 2.2 Product Components
1. **ProductCard.tsx**
   - Port styling and hover effects
   - Update image handling to use Next.js `<Image>`
   - Keep cart integration logic

2. **BundleCard.tsx**
   - Same approach as ProductCard

3. **CartDrawer.tsx**
   - Keep Sheet (Shadcn) implementation
   - Port all cart logic (volume discounts, promo codes)
   - Update to work with Zustand store

#### 2.3 State Management Migration
**Context → Zustand Migration:**

**Before (CartContext.tsx):**
```tsx
export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  // ... cart logic
  return <CartContext.Provider value={...}>{children}</CartContext.Provider>
}
```

**After (cart-store.ts):**
```tsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => { /* logic */ },
      removeItem: (id) => { /* logic */ },
      // ... all cart methods
    }),
    { name: 'cart-storage' }
  )
);
```

**Benefits:**
- Less boilerplate
- Built-in persistence (localStorage)
- Better TypeScript support
- No provider nesting

---

### **Phase 3: Pages Migration (Week 2)**

#### 3.1 Static Pages (Easy)
Port these pages with minimal changes:
- `pages/Index.tsx` → `app/page.tsx`
- `pages/Contact.tsx` → `app/contact/page.tsx`
- `pages/Quality.tsx` → `app/quality/page.tsx`
- `pages/Privacy.tsx` → `app/privacy/page.tsx`
- `pages/Terms.tsx` → `app/terms/page.tsx`
- `pages/Shipping.tsx` → `app/shipping/page.tsx`

**Changes Required:**
- Update imports (remove React Router)
- Use Next.js Link and useRouter
- Keep all styling and content identical

#### 3.2 Dynamic Pages (Medium)
- `pages/Catalog.tsx` → `app/catalog/page.tsx`
  - Implement with SSR (Server Component)
  - Fetch products from WordPress GraphQL
  - Keep all filtering/sorting UI client-side

- `pages/ProductDetail.tsx` → `app/product/[slug]/page.tsx`
  - Use `generateStaticParams` for ISR
  - Fetch single product data
  - Keep image carousel and details UI

- `pages/BundleDetail.tsx` → `app/bundle/[id]/page.tsx`
  - Similar approach as ProductDetail

#### 3.3 Protected Pages (Complex)
- `pages/Account.tsx` → `app/account/page.tsx`
- `pages/AccountDashboard.tsx` → `app/account/dashboard/page.tsx`
- `pages/OrderDetail.tsx` → `app/account/order/[orderId]/page.tsx`

**Additional Work:**
- Implement auth middleware
- Server-side session validation
- Protected route wrappers

---

### **Phase 4: WordPress/WooCommerce Integration (Week 3)**

#### 4.1 WordPress Setup
**Required Plugins:**
```
1. WPGraphQL (Core GraphQL support)
2. WPGraphQL WooCommerce (Expose WC data)
3. WPGraphQL JWT Authentication (User auth)
4. WPGraphQL CORS (Allow Next.js requests)
5. Advanced Custom Fields (Optional: custom product fields)
```

**Configuration:**
- Enable GraphQL endpoint: `/graphql`
- Configure CORS to allow `http://localhost:3000`
- Setup JWT secret in wp-config.php
- Create test products with images and data

#### 4.2 GraphQL Client Setup
**Install dependencies:**
```bash
npm install graphql-request graphql
npm install @tanstack/react-query
```

**Create API client:**
```typescript
// lib/wordpress/graphql.ts
import { GraphQLClient } from 'graphql-request';

export const graphqlClient = new GraphQLClient(
  process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL!,
  {
    headers: {
      authorization: `Bearer ${process.env.WORDPRESS_API_TOKEN}`,
    },
  }
);
```

#### 4.3 Define GraphQL Queries
**Products Query:**
```graphql
query GetProducts($first: Int, $after: String) {
  products(first: $first, after: $after) {
    edges {
      node {
        id
        name
        slug
        price
        image {
          sourceUrl
          altText
        }
        productCategories {
          nodes {
            name
          }
        }
        ... on SimpleProduct {
          regularPrice
          salePrice
          stockQuantity
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

**Single Product Query:**
```graphql
query GetProduct($slug: String!) {
  product(id: $slug, idType: SLUG) {
    id
    name
    slug
    description
    shortDescription
    image {
      sourceUrl
    }
    galleryImages {
      nodes {
        sourceUrl
      }
    }
    ... on SimpleProduct {
      price
      regularPrice
      salePrice
      stockQuantity
    }
  }
}
```

#### 4.4 Replace Mock Data
**Before (demo-design):**
```typescript
// data/products.ts
export const products = [
  { id: 1, name: "BPC-157", price: 45.00, ... }
];
```

**After (Next.js):**
```typescript
// app/catalog/page.tsx (Server Component)
import { fetchProducts } from '@/lib/wordpress/queries';

export default async function CatalogPage() {
  const products = await fetchProducts();
  return <ProductGrid products={products} />;
}
```

#### 4.5 Cart Integration with WooCommerce
**Option A: Session-based Cart (Recommended)**
- Use WooCommerce REST API
- Store cart in WordPress session
- Sync with frontend state

**Option B: Client-side Cart Only**
- Keep current Zustand implementation
- Only sync on checkout
- Simpler but less reliable

**Implementation (Option A):**
```typescript
// lib/woocommerce/cart.ts
export async function addToCart(productId: number, quantity: number) {
  const response = await fetch('/api/cart/add', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });
  return response.json();
}

// app/api/cart/add/route.ts (API Route)
export async function POST(request: Request) {
  const { productId, quantity } = await request.json();
  // Call WooCommerce REST API with session key
  // Update cart in WooCommerce
  // Return updated cart
}
```

---

### **Phase 5: Authentication & User Features (Week 3)**

#### 5.1 JWT Authentication Setup
**WordPress Configuration:**
```php
// wp-config.php
define('GRAPHQL_JWT_AUTH_SECRET_KEY', 'your-secret-key-here');
```

**Login Mutation:**
```graphql
mutation Login($username: String!, $password: String!) {
  login(input: {
    username: $username
    password: $password
  }) {
    authToken
    user {
      id
      name
      email
    }
  }
}
```

#### 5.2 Auth Store Implementation
```typescript
// store/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: async (username, password) => {
        const { authToken, user } = await loginMutation(username, password);
        set({ token: authToken, user });
      },
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'auth-storage' }
  )
);
```

#### 5.3 Protected Routes
```typescript
// middleware.ts (Next.js middleware)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');

  if (!token && request.nextUrl.pathname.startsWith('/account')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*'],
};
```

#### 5.4 User Dashboard & Order History
**Fetch Orders:**
```graphql
query GetCustomerOrders {
  customer {
    orders {
      nodes {
        id
        orderNumber
        date
        status
        total
        lineItems {
          nodes {
            product {
              node {
                name
                image {
                  sourceUrl
                }
              }
            }
            quantity
            total
          }
        }
      }
    }
  }
}
```

**Implementation:**
- Port AccountDashboard.tsx UI exactly as-is
- Replace mock order data with real WooCommerce orders
- Add re-order functionality

---

### **Phase 6: Checkout & Payment (Week 4)**

#### 6.1 Checkout Strategy
**Option A: Redirect to WordPress Checkout (Easiest)**
```typescript
// When user clicks "Checkout" button
router.push(process.env.NEXT_PUBLIC_WORDPRESS_URL + '/checkout');
```

**Option B: Headless Checkout (Advanced)**
- Build custom checkout form in Next.js
- Integrate Stripe Elements or PayPal SDK
- Submit order via WooCommerce API

**Recommendation:** Start with Option A, migrate to Option B later if needed.

#### 6.2 Coupon Validation
**Current (demo-design):**
```typescript
// Mock coupon validation
const validCoupons = { SAVE10: { type: 'percent', amount: 10 } };
```

**Next.js + WooCommerce:**
```typescript
// lib/woocommerce/coupons.ts
export async function applyCoupon(code: string) {
  const response = await fetch('/api/cart/apply-coupon', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  return response.json();
}

// app/api/cart/apply-coupon/route.ts
export async function POST(request: Request) {
  const { code } = await request.json();
  // Call WooCommerce REST API to apply coupon
  // Return updated cart with discount
}
```

#### 6.3 Order Confirmation
- Create thank-you page: `app/order-confirmation/[orderId]/page.tsx`
- Fetch order details from WooCommerce
- Display order summary and tracking info

---

### **Phase 7: Performance Optimization (Week 4)**

#### 7.1 Next.js Image Optimization
**Replace all `<img>` tags:**
```tsx
// Before
<img src={product.image} alt={product.name} />

// After
import Image from 'next/image';
<Image
  src={product.image}
  alt={product.name}
  width={400}
  height={400}
  priority={isPriority}
/>
```

#### 7.2 Static Generation Strategy
**Product Catalog:**
- Use ISR (Incremental Static Regeneration)
- Revalidate every 60 seconds

```typescript
// app/catalog/page.tsx
export const revalidate = 60; // Revalidate every 60 seconds

export default async function CatalogPage() {
  const products = await fetchProducts();
  return <ProductGrid products={products} />;
}
```

**Product Details:**
- Pre-generate top 20 products at build time
- On-demand generation for others

```typescript
// app/product/[slug]/page.tsx
export async function generateStaticParams() {
  const products = await fetchTopProducts(20);
  return products.map(p => ({ slug: p.slug }));
}
```

#### 7.3 Caching Strategy
**TanStack Query Configuration:**
```typescript
// app/providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});
```

#### 7.4 Code Splitting
- Use dynamic imports for heavy components
- Lazy load CartDrawer, modals
- Defer non-critical scripts

```typescript
// Dynamic import example
const CartDrawer = dynamic(() => import('@/components/CartDrawer'), {
  ssr: false,
  loading: () => <CartSkeleton />,
});
```

---

## 📊 Migration Checklist

### Components
- [ ] Header (with search, mobile nav)
- [ ] Footer
- [ ] ProductCard
- [ ] BundleCard
- [ ] CartDrawer (with promo codes, free shipping)
- [ ] Layout wrapper
- [ ] All Shadcn UI components
- [ ] Hero section
- [ ] Products section
- [ ] Quality section

### Pages
- [ ] Home (/)
- [ ] Catalog (/catalog)
- [ ] Product Detail (/product/[slug])
- [ ] Bundle Detail (/bundle/[id])
- [ ] Quality (/quality)
- [ ] Contact (/contact)
- [ ] Privacy Policy
- [ ] Terms of Service
- [ ] Shipping Info
- [ ] Account Login/Register
- [ ] Account Dashboard
- [ ] Order Detail

### Features
- [ ] Product search (instant)
- [ ] Product filtering & sorting
- [ ] Add to cart
- [ ] Cart drawer slide-out
- [ ] Cart persistence (localStorage)
- [ ] Volume discounts
- [ ] Free shipping progress bar
- [ ] Coupon code validation
- [ ] User authentication
- [ ] Order history
- [ ] Profile management
- [ ] Responsive design (mobile/tablet/desktop)

### WordPress Integration
- [ ] GraphQL endpoint setup
- [ ] Product queries
- [ ] Category queries
- [ ] User authentication
- [ ] Cart sync with WooCommerce
- [ ] Order creation
- [ ] Coupon validation
- [ ] Customer dashboard data

### Performance
- [ ] Image optimization (Next.js Image)
- [ ] Font optimization
- [ ] Code splitting
- [ ] Static generation (ISR)
- [ ] API caching
- [ ] Lazy loading

### Testing
- [ ] Unit tests (Jest + React Testing Library)
- [ ] E2E tests (Playwright)
- [ ] Visual regression tests
- [ ] Accessibility audit
- [ ] Performance audit (Lighthouse)
- [ ] Cross-browser testing

---

## 🔧 Environment Setup

### Development Environment Variables
```env
# .env.local
NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL=http://localhost:8000/graphql
NEXT_PUBLIC_WORDPRESS_REST_URL=http://localhost:8000/wp-json
WORDPRESS_API_TOKEN=your_token_here
WOOCOMMERCE_CONSUMER_KEY=ck_xxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Production Environment Variables
```env
# .env.production
NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL=https://yourdomain.com/graphql
NEXT_PUBLIC_WORDPRESS_REST_URL=https://yourdomain.com/wp-json
WORDPRESS_API_TOKEN=your_production_token
WOOCOMMERCE_CONSUMER_KEY=ck_prod_xxx
WOOCOMMERCE_CONSUMER_SECRET=cs_prod_xxx
NEXT_PUBLIC_SITE_URL=https://peptihub.com
```

---

## 🚢 Deployment Strategy

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Set build command: `npm run build`
4. Set output directory: `.next`
5. Enable automatic deployments

**Vercel Configuration:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### Backend (WordPress)
**Option 1: Managed WordPress Hosting**
- WordPress.com Business Plan ($25/month)
- Includes WooCommerce and plugins
- Automatic backups and security

**Option 2: VPS (DigitalOcean/AWS)**
- $12-20/month for VPS
- Install WordPress + WooCommerce manually
- More control but requires maintenance

**Recommended:** Start with WordPress.com, migrate to VPS later if needed.

---

## 📈 Success Metrics

### Performance Targets
- Lighthouse Score: 90+ across all metrics
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1

### SEO Targets
- All pages have unique meta titles and descriptions
- Structured data (JSON-LD) for products
- XML sitemap generation
- Proper heading hierarchy
- Alt text for all images

### User Experience
- Mobile-first responsive design
- Touch-friendly interactive elements (48px minimum)
- Keyboard navigation support
- Screen reader compatibility
- Form validation with clear error messages

---

## 🔄 Post-Launch Roadmap

### Short Term (1-2 months)
- [ ] A/B testing on product pages
- [ ] Advanced filtering (price range, purity %)
- [ ] Product comparison feature
- [ ] Wishlist functionality
- [ ] Email notifications (order confirmation, shipping)

### Medium Term (3-6 months)
- [ ] Product reviews and ratings
- [ ] Referral program
- [ ] Subscription products (recurring orders)
- [ ] Advanced analytics (Google Analytics 4)
- [ ] Conversion rate optimization

### Long Term (6-12 months)
- [ ] Mobile app (React Native)
- [ ] International shipping and multi-currency
- [ ] Bulk ordering for research institutions
- [ ] API for third-party integrations
- [ ] AI-powered product recommendations

---

## 🎓 Learning Resources

### Next.js
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Next.js App Router Guide](https://nextjs.org/docs/app)
- [Server vs Client Components](https://nextjs.org/docs/app/building-your-application/rendering)

### WordPress Headless
- [WPGraphQL Documentation](https://www.wpgraphql.com/docs/introduction)
- [WPGraphQL WooCommerce](https://github.com/wp-graphql/wp-graphql-woocommerce)
- [Headless WordPress Best Practices](https://www.wpgraphql.com/docs/wpgraphql-best-practices)

### TanStack Query
- [React Query Documentation](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Caching Strategy Guide](https://tanstack.com/query/latest/docs/framework/react/guides/caching)

---

## 💡 Key Decisions Summary

| Decision | Chosen Approach | Rationale |
|----------|----------------|-----------|
| **Migration Strategy** | Gradual port from demo-design | Preserve UI/UX, reduce risk |
| **State Management** | Zustand | Lightweight, better DX than Context |
| **Data Fetching** | TanStack Query + GraphQL | Caching, optimistic updates |
| **Styling** | Tailwind CSS (from demo) | Consistent with existing design |
| **Checkout** | Redirect to WP (Phase 1) | Faster MVP, migrate later |
| **Image Optimization** | Next.js Image component | Automatic optimization |
| **Hosting** | Vercel (FE) + WordPress.com (BE) | Optimal performance, ease of use |

---

## 🏁 Next Steps

1. **Review this document** with stakeholders
2. **Setup development environment** (Next.js + WordPress)
3. **Begin Phase 1** (Foundation Setup)
4. **Weekly progress reviews** to ensure alignment
5. **Prepare test data** in WordPress (products, categories)

---

## 📞 Support & Communication

- **Project Owner:** [Your Name]
- **Lead Developer:** [Developer Name]
- **Design Reference:** `demo-design/` folder
- **Documentation:** `docs/` folder
- **Issues:** GitHub Issues or project management tool

---

**Last Updated:** February 16, 2026
**Version:** 1.0.0
**Status:** Ready for Implementation
