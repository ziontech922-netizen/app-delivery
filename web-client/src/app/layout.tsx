import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Super App - Hub de Negócios Locais',
  description: 'Sua plataforma completa: delivery, marketplace, serviços, chat e muito mais. Tudo em um só lugar.',
  keywords: ['super app', 'delivery', 'marketplace', 'serviços', 'chat', 'negócios locais'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <BottomNav />
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
