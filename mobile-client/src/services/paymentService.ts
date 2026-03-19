import api from '../config/api';

export interface PaymentIntent {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: string;
  status: 'CREATED' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  externalId?: string;
  expiresAt?: string;
  createdAt: string;
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  pixTicketUrl?: string;
  pixKey?: string;
  cardLast4?: string;
  cardBrand?: string;
  failureCode?: string;
  failureMessage?: string;
}

export interface CreatePaymentIntentParams {
  orderId: string;
  method: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH';
}

export interface ProcessCardPaymentParams {
  paymentIntentId: string;
  token: string;
  installments?: number;
}

export const paymentService = {
  async createIntent(data: CreatePaymentIntentParams): Promise<PaymentIntent> {
    const response = await api.post<PaymentIntent>('/payments/intents', data);
    return response.data;
  },

  async getIntent(id: string): Promise<PaymentIntent> {
    const response = await api.get<PaymentIntent>(`/payments/intents/${id}`);
    return response.data;
  },

  async getIntentByOrder(orderId: string): Promise<PaymentIntent> {
    const response = await api.get<PaymentIntent>(`/payments/orders/${orderId}/intent`);
    return response.data;
  },

  async processCard(data: ProcessCardPaymentParams): Promise<PaymentIntent> {
    const response = await api.post<PaymentIntent>('/payments/process-card', data);
    return response.data;
  },
};

export default paymentService;
