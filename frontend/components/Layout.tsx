"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => (
  <div className="min-h-screen flex flex-col overflow-x-hidden">
    <Header />
    <main className="flex-1">
      {children}
    </main>
    <Footer />
    <CartDrawer />
  </div>
);

export default Layout;
