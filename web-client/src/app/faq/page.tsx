'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'Como faço para criar uma conta?',
    answer: 'Clique em "Criar conta" na página inicial e preencha seus dados. Você pode se cadastrar com email, telefone ou usando Google/Facebook.',
  },
  {
    question: 'Quais formas de pagamento são aceitas?',
    answer: 'Aceitamos cartões de crédito/débito, PIX e pagamento na entrega (dinheiro). As formas disponíveis podem variar de acordo com o estabelecimento.',
  },
  {
    question: 'Como acompanho meu pedido?',
    answer: 'Após fazer um pedido, você pode acompanhar em tempo real pela aba "Pedidos". Você receberá notificações sobre cada etapa.',
  },
  {
    question: 'Posso cancelar um pedido?',
    answer: 'Sim, você pode cancelar enquanto o pedido não foi aceito pelo estabelecimento. Após aceito, entre em contato com o suporte.',
  },
  {
    question: 'Como funciona o marketplace?',
    answer: 'No marketplace você pode comprar e vender produtos novos ou usados. Crie sua conta, publique seus itens e negocie diretamente pelo chat.',
  },
  {
    question: 'É seguro comprar pelo SuperApp?',
    answer: 'Sim! Todos os pagamentos são processados com segurança. Além disso, oferecemos sistema de avaliações e proteção ao comprador.',
  },
  {
    question: 'Como me torno um vendedor/parceiro?',
    answer: 'Acesse a seção "Seja Parceiro" e escolha a categoria: comerciante, entregador ou vendedor no marketplace. Siga as instruções para criar sua conta.',
  },
  {
    question: 'Qual o prazo de entrega?',
    answer: 'O prazo varia conforme o estabelecimento e sua localização. O tempo estimado é mostrado antes de confirmar o pedido.',
  },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <span className="font-medium text-gray-900">{item.question}</span>
        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-gray-600">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-6">Perguntas Frequentes</h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Encontre respostas para as dúvidas mais comuns sobre o SuperApp.
        </p>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQAccordion key={index} item={faq} />
          ))}
        </div>

        <div className="mt-12 bg-orange-50 rounded-xl p-6 text-center">
          <p className="text-gray-700 mb-4">Não encontrou o que procurava?</p>
          <Link href="/contact" className="text-orange-600 font-medium hover:underline">
            Entre em contato com nosso suporte
          </Link>
        </div>
      </div>
    </div>
  );
}
