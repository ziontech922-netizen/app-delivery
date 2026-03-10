import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/layout/Navbar';
import CartDrawer from '@/components/cart/CartDrawer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Delivery App - Peça sua comida favorita',
  description: 'A melhor plataforma de delivery da região. Peça comida dos melhores restaurantes.',
  keywords: ['delivery', 'comida', 'restaurante', 'pedido', 'entrega'],
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
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
