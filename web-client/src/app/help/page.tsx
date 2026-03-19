'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, MessageCircle, Phone, Mail, ChevronDown, ChevronUp,
  ShoppingBag, CreditCard, Truck, UserX, MapPin, Clock
} from 'lucide-react';

const faqItems = [
  {
    category: 'Pedidos',
    icon: ShoppingBag,
    questions: [
      {
        q: 'Como faço um pedido?',
        a: 'Escolha um restaurante, selecione os itens desejados, adicione ao carrinho, defina o endereço de entrega e finalize o pagamento. Você pode acompanhar o status do pedido em tempo real.'
      },
      {
        q: 'Posso cancelar um pedido?',
        a: 'Sim, é possível cancelar pedidos que ainda não entraram em preparação. Acesse "Meus pedidos", selecione o pedido e toque em "Cancelar". Após o início da preparação, entre em contato com o suporte.'
      },
      {
        q: 'Como acompanho meu pedido?',
        a: 'Após confirmar o pedido, acesse "Meus pedidos" para ver o status em tempo real: confirmado, em preparação, pronto, a caminho e entregue.'
      },
    ]
  },
  {
    category: 'Pagamento',
    icon: CreditCard,
    questions: [
      {
        q: 'Quais formas de pagamento são aceitas?',
        a: 'Atualmente aceitamos PIX e pagamento em dinheiro na entrega. Em breve teremos cartão de crédito e débito.'
      },
      {
        q: 'O pagamento é seguro?',
        a: 'Sim! Todos os pagamentos são processados com criptografia de ponta a ponta, seguindo os padrões mais rigorosos do mercado.'
      },
    ]
  },
  {
    category: 'Entrega',
    icon: Truck,
    questions: [
      {
        q: 'Qual o tempo de entrega?',
        a: 'O tempo varia de acordo com o restaurante e a distância. A estimativa é mostrada antes de confirmar o pedido. Em média, de 30 a 60 minutos.'
      },
      {
        q: 'Como é calculada a taxa de entrega?',
        a: 'A taxa considera a distância entre o restaurante e o endereço de entrega, além da demanda no momento.'
      },
    ]
  },
  {
    category: 'Conta',
    icon: UserX,
    questions: [
      {
        q: 'Como altero meus dados?',
        a: 'Acesse "Meu perfil" > "Dados pessoais" para atualizar nome, telefone e outras informações. O e-mail de login não pode ser alterado.'
      },
      {
        q: 'Como excluo minha conta?',
        a: 'Acesse "Meu perfil" > "Privacidade e segurança" > "Excluir minha conta". Conforme a LGPD, seus dados serão removidos. Essa ação é irreversível.'
      },
    ]
  },
];

export default function HelpPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleFaq = (key: string) => {
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Central de Ajuda</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {/* Contato rápido */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Fale conosco</h3>
          <div className="grid grid-cols-3 gap-3">
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center">WhatsApp</span>
            </a>
            <a
              href="mailto:suporte@superapp.com"
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center">E-mail</span>
            </a>
            <a
              href="tel:+5511999999999"
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Phone className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center">Ligar</span>
            </a>
          </div>
        </div>

        {/* Horário */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Horário de atendimento</p>
            <p className="text-sm text-blue-700">Segunda a sexta: 08h às 22h</p>
            <p className="text-sm text-blue-700">Sábado e domingo: 09h às 20h</p>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Perguntas frequentes</h3>
          <div className="space-y-4">
            {faqItems.map((section) => (
              <div key={section.category}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <section.icon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{section.category}</span>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {section.questions.map((faq, i) => {
                    const key = `${section.category}-${i}`;
                    const isOpen = openIndex === key;
                    return (
                      <div key={key} className={i > 0 ? 'border-t border-gray-100' : ''}>
                        <button
                          onClick={() => toggleFaq(key)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="flex-1 text-sm text-gray-700">{faq.q}</span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-3.5">
                            <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
