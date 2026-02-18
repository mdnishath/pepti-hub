import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PeptiPay Dashboard',
  description: 'Cryptocurrency Payment Gateway Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.Node;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
