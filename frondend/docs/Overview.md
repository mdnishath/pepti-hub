# Project Overview: Pepti-Hub E-Commerce

## Introduction
This project aims to build a high-performance, lovable e-commerce application for selling research peptides. The design is based on the provided "Demo Design" (Lovable-style), ensuring a premium, modern, and trustworthy user experience.

## Architecture
The system follows a **Headless Commerce** architecture:

-   **Frontend**: **Next.js 16+** (App Router).
    -   Hosted on Vercel or similar.
    -   Responsible for the UI, Routing, and Interactivity.
    -   Connects to WordPress via API.
-   **Backend**: **WordPress** (Headless setup).
    -   Hosted locally (initially) or on a VPS.
    -   Serves as the Content Management System (CMS) and Product Database.
-   **E-Commerce Engine**: **WooCommerce**.
    -   Manages Products, Inventory, Orders, and Customers.
    -   **Payment Gateway**: WooCommerce Payment methods (Stripe/PayPal/Direct).

## Technology Stack

### Frontend (The "App")
-   **Framework**: Next.js 16 (React 19).
-   **Language**: TypeScript.
-   **Styling**: **Tailwind CSS** (v4 preferred) + **Shadcn/UI** (for components).
-   **Animation**: Framer Motion (for "Lovable" micro-interactions).
-   **Icons**: Lucide React.
-   **State Management**: Zustand or React Context (for Cart/Auth).
-   **Data Fetching**: WPGraphQL or WooCommerce REST API (using TanStack Query).

### Backend (The "Engine")
-   **CMS**: WordPress.
-   **Plugin**: WooCommerce.
-   **API Layer**: WPGraphQL + WPGraphQL WooCommerce (extensions).

## Design Philosophy
-   **Aesthetic**: Clean, Clinical yet Modern ("Lovable" style).
-   **Colors**: Deep Blue (Trust), White/Surface (Cleanliness), Primary Accents.
-   **UX**: Fast transitions, Slide-out Cart, Instant Search, Volume Discount indicators.
