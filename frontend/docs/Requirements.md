# Technical Requirements

## Frontend Environment (Next.js)
-   **Node.js**: v18+ (LTS).
-   **Framework**: Next.js 16 (App Router).
-   **Language**: TypeScript 5+.
-   **UI Library**: Shadcn/UI (Radix Primitives).
-   **Styling**: Tailwind CSS v3 or v4.
-   **Icons**: Lucide React.
-   **State Management**: Zustand (recommended) or Context API.
-   **Form Handling**: React Hook Form + Zod.
-   **Data Fetching**: TanStack Query (React Query) v5.

## Backend Environment (WordPress)
-   **PHP**: 8.1+.
-   **WordPress**: Latest version (6.4+).
-   **WooCommerce**: Latest version.
-   **Critical Plugins**:
    -   **WPGraphQL**: For GraphQL API support.
    -   **WPGraphQL WooCommerce**: To expose WC data to GraphQL.
    -   **WPGraphQL JWT Authentication**: For user login.
    -   **Advanced Custom Fields (ACF)**: If custom product fields are needed.
    -   **WPGraphQL CORS**: To allow requests from the Next.js frontend.

## API Requirements
-   **Authentication Endpoint**: To exchange username/password for JWT Token.
-   **Products Query**: Fetch list of products with pagination, filtering, and sorting.
-   **Single Product Query**: Fetch details by slug/ID.
-   **Cart API**: (CoCart or native WC REST API) to manage session-based cart.
-   **Checkout Mutation**: To create an order from cart contents.

## Hosting & Deployment
-   **Frontend**: Vercel (recommended for Next.js) or any Node.js host.
-   **Backend**: Any PHP/MySQL hosting (e.g., SiteGround, DigitalOcean, or Localhost during dev).
-   **Environment Variables**:
    -   `NEXT_PUBLIC_WORDPRESS_API_URL`: URL to GraphQL endpoint.
    -   `WOOCOMMERCE_CONSUMER_KEY`: (If using REST API).
    -   `WOOCOMMERCE_CONSUMER_SECRET`: (If using REST API).
