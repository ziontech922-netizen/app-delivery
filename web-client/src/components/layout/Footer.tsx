'use client';

import Link from 'next/link';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Smartphone,
  ShieldCheck,
  CreditCard,
  Truck,
  MessageCircle
} from 'lucide-react';

const FOOTER_LINKS = {
  explore: {
    title: 'Explorar',
    links: [
      { label: 'Restaurantes', href: '/#restaurants' },
      { label: 'Marketplace', href: '/listings' },
      { label: 'Serviços', href: '/listings?category=SERVICES' },
      { label: 'Veículos', href: '/listings?category=VEHICLES' },
      { label: 'Imóveis', href: '/listings?category=REAL_ESTATE' },
      { label: 'Empregos', href: '/listings?category=JOBS' },
    ],
  },
  company: {
    title: 'Empresa',
    links: [
      { label: 'Sobre nós', href: '/about' },
      { label: 'Carreiras', href: '/careers' },
      { label: 'Blog', href: '/blog' },
      { label: 'Imprensa', href: '/press' },
      { label: 'Parceiros', href: '/partners' },
    ],
  },
  partners: {
    title: 'Para Parceiros',
    links: [
      { label: 'Seja um parceiro', href: '/merchant/register' },
      { label: 'Portal do parceiro', href: '/merchant/login' },
      { label: 'Seja um entregador', href: '/driver/register' },
      { label: 'Portal do entregador', href: '/driver/login' },
      { label: 'Anuncie conosco', href: '/advertise' },
    ],
  },
  support: {
    title: 'Suporte',
    links: [
      { label: 'Central de ajuda', href: '/help' },
      { label: 'Fale conosco', href: '/contact' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Segurança', href: '/security' },
      { label: 'Acessibilidade', href: '/accessibility' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Termos de uso', href: '/terms' },
      { label: 'Privacidade', href: '/privacy' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'LGPD', href: '/lgpd' },
    ],
  },
};

const SOCIAL_LINKS = [
  { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
  { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
];

const FEATURES = [
  { icon: Truck, label: 'Entrega rápida' },
  { icon: ShieldCheck, label: 'Compra segura' },
  { icon: CreditCard, label: 'Pagamento facilitado' },
  { icon: MessageCircle, label: 'Suporte 24h' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Features Bar */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map((feature) => (
              <div key={feature.label} className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <feature.icon className="h-5 w-5 text-orange-500" />
                </div>
                <span className="text-sm font-medium text-gray-400">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold text-white">
                Super<span className="text-orange-500">App</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 mb-6 max-w-xs">
              Tudo que você precisa, em um só lugar. Delivery, marketplace, serviços e muito mais.
            </p>
            
            {/* Contact */}
            <div className="space-y-3 mb-6">
              <a 
                href="mailto:contato@superapp.com" 
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-orange-500 transition-colors"
              >
                <Mail className="h-4 w-4" />
                contato@superapp.com
              </a>
              <a 
                href="tel:+5511999999999" 
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-orange-500 transition-colors"
              >
                <Phone className="h-4 w-4" />
                (11) 99999-9999
              </a>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="h-4 w-4" />
                São Paulo, Brasil
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-800 rounded-lg hover:bg-orange-500 transition-colors group"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5 text-gray-400 group-hover:text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{FOOTER_LINKS.explore.title}</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.explore.links.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-sm text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{FOOTER_LINKS.company.title}</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.company.links.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-sm text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Partners Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{FOOTER_LINKS.partners.title}</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.partners.links.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-sm text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{FOOTER_LINKS.support.title}</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.support.links.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-sm text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{FOOTER_LINKS.legal.title}</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.legal.links.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-sm text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* App Download Section */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <Smartphone className="h-8 w-8 text-orange-500" />
              </div>
              <div>
                <h4 className="text-white font-semibold">Baixe nosso app</h4>
                <p className="text-sm text-gray-400">Disponível para iOS e Android</p>
              </div>
            </div>
            <div className="flex gap-4">
              <a
                href="#"
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs text-gray-400">Baixar na</div>
                  <div className="text-sm font-semibold text-white">App Store</div>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 9.09l-2.302 2.302-8.634-8.734z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs text-gray-400">Disponível no</div>
                  <div className="text-sm font-semibold text-white">Google Play</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © {currentYear} SuperApp. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Feito com ❤️ no Brasil</span>
              <span>•</span>
              <span>CNPJ: 00.000.000/0001-00</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
