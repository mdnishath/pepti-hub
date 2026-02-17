import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pepti Hub",
  description: "Premium Peptides and Research Compounds",
  authors: [{ name: "Pepti Hub" }],
  openGraph: {
    title: "Pepti Hub",
    description: "Premium Peptides and Research Compounds",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
          <Sonner
            position="top-right"
            toastOptions={{
              style: {
                background: 'white',
              },
              className: 'sonner-toast',
              duration: 4000,
            }}
            richColors
          />
        </Providers>
      </body>
    </html>
  );
}
