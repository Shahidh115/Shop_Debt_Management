import type { Metadata } from 'next';
import './globals.css';
import { AdminStoreProvider } from '@/lib/store';

export const metadata: Metadata = {
  title: 'ShopLedger — Platform Administration & Credit Management SaaS',
  description:
    'Credit, with clarity. Multi-tenant shop credit and debt management platform for neighbourhood shops and customers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body className="min-h-screen bg-[#F4F8F6] text-[#16241D] antialiased">
        <AdminStoreProvider>{children}</AdminStoreProvider>
      </body>
    </html>
  );
}

