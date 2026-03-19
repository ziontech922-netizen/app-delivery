'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, ArrowRight } from 'lucide-react';

export default function BlogPage() {
  const posts = [
    {
      title: 'Como o SuperApp está transformando o comércio local',
      excerpt: 'Descubra como nossa plataforma está ajudando pequenos negócios a crescerem e alcançarem mais clientes.',
      date: '15 Mar 2026',
      readTime: '5 min',
    },
    {
      title: 'Dicas para vender mais no marketplace',
      excerpt: 'Confira estratégias comprovadas para aumentar suas vendas e se destacar no marketplace do SuperApp.',
      date: '10 Mar 2026',
      readTime: '7 min',
    },
    {
      title: 'Novidades da última atualização',
      excerpt: 'Conheça as novas funcionalidades que lançamos para melhorar sua experiência no aplicativo.',
      date: '05 Mar 2026',
      readTime: '3 min',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-6">Blog</h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Novidades, dicas e histórias do universo SuperApp.
        </p>

        <div className="space-y-6">
          {posts.map((post, index) => (
            <article key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h2>
              <p className="text-gray-600 mb-4">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post.readTime}
                  </span>
                </div>
                <span className="text-orange-600 font-medium flex items-center gap-1 hover:underline cursor-pointer">
                  Ler mais <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500">
            Em breve mais conteúdos! Fique ligado.
          </p>
        </div>
      </div>
    </div>
  );
}
