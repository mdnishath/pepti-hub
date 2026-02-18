'use client';

import { ReactNode } from 'react';
import '../globals.css';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-dark-bg">
      {children}
    </div>
  );
}
