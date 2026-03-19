'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-6">Fale Conosco</h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Estamos aqui para ajudar! Entre em contato conosco através dos canais abaixo.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <Mail className="w-10 h-10 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Email</h3>
            <p className="text-gray-600">contato@superapp.com.br</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <Phone className="w-10 h-10 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Telefone</h3>
            <p className="text-gray-600">(11) 4000-0000</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <MessageCircle className="w-10 h-10 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Chat</h3>
            <p className="text-gray-600">Disponível no app 24/7</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <MapPin className="w-10 h-10 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Endereço</h3>
            <p className="text-gray-600">São Paulo, SP - Brasil</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-6">Envie uma mensagem</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
              <textarea rows={4} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"></textarea>
            </div>
            <button type="submit" className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600">
              Enviar Mensagem
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
