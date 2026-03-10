'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Search,
  Filter,
  Eye,
  RefreshCcw,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowDownLeft,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { adminService, AdminPayment } from '@/services/admin.service';
import { formatCurrency, formatDate } from '@/utils/format';

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  PENDING: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pendente' },
  PROCESSING: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Processando' },
  COMPLETED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Concluído' },
  FAILED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Falhou' },
  REFUNDED: { icon: ArrowDownLeft, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Reembolsado' },
};

const methodLabels: Record<string, string> = {
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  PIX: 'PIX',
  CASH: 'Dinheiro',
  WALLET: 'Carteira Digital',
};

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');

  // Fetch payments
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'payments', statusFilter],
    queryFn: () => adminService.getPayments({
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    placeholderData: {
      data: [
        {
          id: '1',
          transactionId: 'TXN-2024-001234',
          orderId: 'ORD-2024-001',
          amount: 89.90,
          method: 'CREDIT_CARD' as const,
          status: 'COMPLETED' as const,
          createdAt: '2024-03-08T18:30:00Z',
          completedAt: '2024-03-08T18:31:00Z',
          customer: { id: 'c1', firstName: 'Carlos', lastName: 'Silva', email: 'carlos@email.com' },
          merchant: { id: 'm1', tradeName: 'Pizzaria Bella Italia' },
          gatewayResponse: { cardLast4: '4242', brand: 'Visa' },
        },
        {
          id: '2',
          transactionId: 'TXN-2024-001235',
          orderId: 'ORD-2024-002',
          amount: 52.50,
          method: 'PIX' as const,
          status: 'COMPLETED' as const,
          createdAt: '2024-03-08T19:45:00Z',
          completedAt: '2024-03-08T19:46:00Z',
          customer: { id: 'c2', firstName: 'Ana', lastName: 'Costa', email: 'ana@email.com' },
          merchant: { id: 'm2', tradeName: 'Burguer House' },
          gatewayResponse: null,
        },
        {
          id: '3',
          transactionId: 'TXN-2024-001236',
          orderId: 'ORD-2024-003',
          amount: 75.00,
          method: 'CREDIT_CARD' as const,
          status: 'REFUNDED' as const,
          createdAt: '2024-03-08T12:00:00Z',
          completedAt: '2024-03-08T12:01:00Z',
          customer: { id: 'c3', firstName: 'Roberto', lastName: 'Lima', email: 'roberto@email.com' },
          merchant: { id: 'm3', tradeName: 'Sushi Master' },
          gatewayResponse: { cardLast4: '1234', brand: 'Mastercard' },
        },
        {
          id: '4',
          transactionId: 'TXN-2024-001237',
          orderId: 'ORD-2024-004',
          amount: 120.00,
          method: 'DEBIT_CARD' as const,
          status: 'FAILED' as const,
          createdAt: '2024-03-08T20:00:00Z',
          completedAt: null,
          customer: { id: 'c4', firstName: 'Paula', lastName: 'Mendes', email: 'paula@email.com' },
          merchant: { id: 'm1', tradeName: 'Pizzaria Bella Italia' },
          gatewayResponse: { error: 'Saldo insuficiente' },
        },
      ],
      total: 4,
    },
  });

  // Refund mutation
  const refundMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminService.refundPayment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      setShowRefundModal(false);
      setSelectedPayment(null);
      setRefundReason('');
    },
  });

  const payments = data?.data || [];
  const filteredPayments = payments.filter(
    (p) =>
      p.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customer.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openDetails = (payment: AdminPayment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const openRefund = (payment: AdminPayment) => {
    setSelectedPayment(payment);
    setShowRefundModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
        <p className="text-gray-500 mt-1">Visualizar transações e processar reembolsos</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por transação, pedido, cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todos os Status</option>
              <option value="PENDING">Pendente</option>
              <option value="PROCESSING">Processando</option>
              <option value="COMPLETED">Concluído</option>
              <option value="FAILED">Falhou</option>
              <option value="REFUNDED">Reembolsado</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Transação
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Merchant
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Nenhum pagamento encontrado
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const StatusIcon = statusConfig[payment.status]?.icon || Clock;
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {payment.transactionId}
                          </p>
                          <p className="text-xs text-gray-500">
                            Pedido: {payment.orderId}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {payment.customer.firstName} {payment.customer.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{payment.customer.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{payment.merchant.tradeName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{methodLabels[payment.method]}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            statusConfig[payment.status]?.bg
                          } ${statusConfig[payment.status]?.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[payment.status]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDetails(payment)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            title="Ver detalhes"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          {payment.status === 'COMPLETED' && (
                            <button
                              onClick={() => openRefund(payment)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                              title="Reembolsar"
                            >
                              <RefreshCcw className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalhes do Pagamento
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Transaction Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900 text-sm">
                    {selectedPayment.transactionId}
                  </p>
                  <p className="text-xs text-gray-500">
                    Pedido: {selectedPayment.orderId}
                  </p>
                </div>

                {/* Amount & Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Valor</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(selectedPayment.amount)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                      statusConfig[selectedPayment.status]?.bg
                    } ${statusConfig[selectedPayment.status]?.color}`}
                  >
                    {statusConfig[selectedPayment.status]?.label}
                  </span>
                </div>

                {/* Method */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Método de Pagamento</p>
                  <p className="text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    {methodLabels[selectedPayment.method]}
                    {selectedPayment.gatewayResponse?.cardLast4 && (
                      <span className="text-gray-500">
                        •••• {selectedPayment.gatewayResponse.cardLast4}
                      </span>
                    )}
                  </p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Criado em</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(new Date(selectedPayment.createdAt))}
                    </p>
                  </div>
                  {selectedPayment.completedAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Concluído em</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(new Date(selectedPayment.completedAt))}
                      </p>
                    </div>
                  )}
                </div>

                {/* Customer */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Cliente</p>
                  <p className="text-sm">
                    {selectedPayment.customer.firstName} {selectedPayment.customer.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{selectedPayment.customer.email}</p>
                </div>

                {/* Merchant */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Merchant</p>
                  <p className="text-sm">{selectedPayment.merchant.tradeName}</p>
                </div>

                {/* Error (if failed) */}
                {selectedPayment.gatewayResponse?.error && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <p className="text-sm font-medium text-red-800">Erro</p>
                    <p className="text-sm text-red-600">
                      {selectedPayment.gatewayResponse.error}
                    </p>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full mt-6"
                onClick={() => setShowDetailsModal(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Processar Reembolso
            </h3>
            <p className="text-gray-500 mb-2">
              Tem certeza que deseja reembolsar a transação{' '}
              <span className="font-medium text-gray-900">
                {selectedPayment.transactionId}
              </span>
              ?
            </p>
            <p className="text-lg font-bold text-gray-900 mb-4">
              Valor: {formatCurrency(selectedPayment.amount)}
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo do reembolso
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Informe o motivo..."
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedPayment(null);
                  setRefundReason('');
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={() => refundMutation.mutate({ id: selectedPayment.id, reason: refundReason })}
                isLoading={refundMutation.isPending}
                disabled={!refundReason.trim()}
              >
                Confirmar Reembolso
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
