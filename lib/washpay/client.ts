const WASHPAY_BASE_URL = 'https://washpay.com.br';

export interface WashPayProduct {
  id?: string;
  name: string;
  description?: string;
  price: number;
  isActive?: boolean;
}

export interface WashPayPaymentMethod {
  method: string;
  name: string;
  description: string;
}

export interface WashPayPaymentLink {
  id?: string;
  title: string;
  description?: string;
  amount: number;
  productId: string;
  paymentMethods: string[];
  isActive?: boolean;
  expiresAt?: string;
}

export interface WashPayCreateOrderRequest {
  paymentLinkId: string;
  customerName: string;
  customerEmail: string;
  customerCpf: string;
  customerPhone?: string;
  paymentMethod: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO';
  addressCep?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressUf?: string;
}

export interface WashPayDirectCheckoutRequest {
  productName: string;
  productAmount: number;
  customerName: string;
  customerEmail: string;
  customerCpf: string;
  customerPhone?: string;
  paymentMethod: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO';
}

export interface WashPayDirectCheckoutResponse {
  success: boolean;
  data: {
    orderId: string;
    orderNumber: string;
    productId: string;
    paymentLinkId: string;
    pix?: {
      qr_code: string;
      image: string;
    };
  };
}

export interface WashPayOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED' | 'CHARGEBACK';
  paymentMethod: string;
  pixQrCode?: string;
  pixQrCodeImage?: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WashPayWebhookPayload {
  orderId: string;
  orderNumber: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED' | 'CHARGEBACK';
  createdAt: string;
  updatedAt: string;
}

class WashPayClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = WASHPAY_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WashPay API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Products
  async listProducts(): Promise<{ success: boolean; data: { products: WashPayProduct[] } }> {
    return this.request('/api/user/products');
  }

  async createProduct(product: { name: string; description?: string; price: number; isActive?: boolean }): Promise<{ success: boolean; data: WashPayProduct }> {
    return this.request('/api/user/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async getProduct(id: string): Promise<{ success: boolean; data: WashPayProduct }> {
    return this.request(`/api/user/products/${id}`);
  }

  // Payment Methods
  async listPaymentMethods(): Promise<{ success: boolean; data: { methods: WashPayPaymentMethod[] } }> {
    return this.request('/api/user/payment-methods');
  }

  // Payment Links
  async listPaymentLinks(): Promise<{ success: boolean; data: { paymentLinks: WashPayPaymentLink[] } }> {
    return this.request('/api/user/payment-links');
  }

  async createPaymentLink(link: {
    title: string;
    description?: string;
    amount: number;
    productId: string;
    paymentMethods: string[];
    isActive?: boolean;
    expiresAt?: string;
  }): Promise<{ success: boolean; data: WashPayPaymentLink }> {
    return this.request('/api/user/payment-links', {
      method: 'POST',
      body: JSON.stringify(link),
    });
  }

  async getPaymentLink(id: string): Promise<{ success: boolean; data: WashPayPaymentLink }> {
    return this.request(`/api/user/payment-links/${id}`);
  }

  // Orders
  async listOrders(): Promise<{ success: boolean; data: { orders: WashPayOrder[] } }> {
    return this.request('/api/user/orders');
  }

  async createOrder(order: WashPayCreateOrderRequest): Promise<{ success: boolean; data: WashPayOrder }> {
    return this.request('/api/user/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async getOrder(id: string): Promise<{ success: boolean; data: WashPayOrder }> {
    return this.request(`/api/user/orders/${id}`);
  }

  // Direct Checkout - creates product + payment link + order in one call
  async directCheckout(data: WashPayDirectCheckoutRequest): Promise<WashPayDirectCheckoutResponse> {
    return this.request('/api/user/direct-checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Singleton instance
let washPayClient: WashPayClient | null = null;

export function getWashPayClient(): WashPayClient {
  if (!washPayClient) {
    const apiKey = process.env.WASHPAY_API_KEY;
    if (!apiKey) {
      throw new Error('WASHPAY_API_KEY environment variable is not set');
    }
    washPayClient = new WashPayClient(apiKey);
  }
  return washPayClient;
}

export { WashPayClient };
