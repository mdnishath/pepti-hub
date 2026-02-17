"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/useAuthStore";
import { CartProvider } from "@/contexts/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    console.log("🔵 AuthInitializer: Initializing auth from storage");
    initialize();
  }, [initialize]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();

  // Check if we're on an admin route
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthInitializer>
          <CartProvider>
            {isAdminRoute ? (
              // Admin routes: No Header/Footer, just content
              <>{children}</>
            ) : (
              // Public routes: Show Header, Footer, and Cart
              <div className="min-h-screen flex flex-col overflow-x-hidden">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
                <CartDrawer />
              </div>
            )}
          </CartProvider>
        </AuthInitializer>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
