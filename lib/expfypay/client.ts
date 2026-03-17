/**
 * EXPFY Pay API Client
 * Documentação: https://pro.expfypay.com/api/v1
 */

const BASE_URL = 'https://pro.expfypay.com/api/v1';

interface ExpfyCustomer {
  name: string;
  document: string;
  email: string;
}

interface CreatePaymentRequest {
  amount: number;
  description: string;
  customer: ExpfyCustomer;
  external_id: string;
  callback_url: string;
}

interface ExpfyPaymentResponse {
  success: boolean;
  data: {
    transaction_id: string;
    external_id: string;
    qr_code: string;
    qr_code_image: string;
    amount: number;
    status: string;
  };
}

interface WithdrawalRequest {
  amount: number;
  pix_key: string;
  pix_key_type: string;
  description: string;
  callback_url: string;
}

interface BalanceResponse {
  success: boolean;
  data: {
    balance: number;
  };
}

export class ExpfyPayClient {
  private publicKey: string;
  private secretKey: string;

  constructor(publicKey: string, secretKey: string) {
    this.publicKey = publicKey;
    this.secretKey = secretKey;
  }

  private async request<T>(endpoint: string, body: unknown): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Public-Key': this.publicKey,
        'X-Secret-Key': this.secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`EXPFY API error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  /**
   * Gerar pagamento PIX
   */
  async createPayment(params: CreatePaymentRequest): Promise<ExpfyPaymentResponse> {
    return this.request<ExpfyPaymentResponse>('/payments', params);
  }

  /**
   * Consultar saldo
   */
  async getBalance(): Promise<BalanceResponse> {
    return this.request<BalanceResponse>('/getBalance', {
      public_key: this.publicKey,
      secret_key: this.secretKey,
    });
  }

  /**
   * Solicitar saque PIX
   */
  async requestWithdrawal(params: WithdrawalRequest): Promise<{ success: boolean; data: { transaction_id: string } }> {
    return this.request('/withdrawal', params);
  }

  /**
   * Validar assinatura do webhook (HMAC-SHA256)
   */
  static async verifyWebhookSignature(body: string, signature: string, secretKey: string): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secretKey),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
      const expectedSig = Array.from(new Uint8Array(sig))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      return expectedSig === signature;
    } catch {
      return false;
    }
  }
}
