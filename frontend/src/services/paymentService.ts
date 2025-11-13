import api from './api';

export interface CreatePaymentIntentRequest {
  orderId: string;
}

export interface CreatePaymentIntentResponse {
  success: boolean;
  data: {
    clientSecret: string;
    paymentIntentId: string;
  };
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
}

export interface PaymentResponse {
  success: boolean;
  data: {
    id: string;
    orderId: string;
    amount: number;
    paymentMethod: string;
    paymentStatus: string;
    transactionId?: string;
    paidAt?: string;
    refundedAt?: string;
    createdAt: string;
  };
  message?: string;
}

export interface ProcessRefundRequest {
  orderId: string;
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}

export const paymentService = {
  async createPaymentIntent(data: CreatePaymentIntentRequest): Promise<CreatePaymentIntentResponse> {
    const response = await api.post('/payment/create-intent', data);
    return response.data;
  },

  async confirmPayment(data: ConfirmPaymentRequest): Promise<PaymentResponse> {
    const response = await api.post('/payment/confirm', data);
    return response.data;
  },

  async processRefund(data: ProcessRefundRequest): Promise<PaymentResponse> {
    const response = await api.post('/payment/refund', data);
    return response.data;
  },

  // Format price for display
  formatPrice(amount: number): string {
    return `$${(amount / 100).toFixed(2)}`;
  },

  // Validate card number (basic Luhn algorithm)
  validateCardNumber(cardNumber: string): boolean {
    const number = cardNumber.replace(/\s/g, '');
    let sum = 0;
    let shouldDouble = false;

    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number.charAt(i), 10);

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  },

  // Detect card type from number
  detectCardType(cardNumber: string): string {
    const number = cardNumber.replace(/\s/g, '');

    if (/^4/.test(number)) return 'visa';
    if (/^5[1-5]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    if (/^6/.test(number)) return 'discover';

    return 'unknown';
  },
};
