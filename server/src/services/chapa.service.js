/**
 * Chapa Payment Gateway Service
 * Handles transaction initialization and verification with Chapa API
 */

const CHAPA_API_URL = 'https://api.chapa.co/v1';

export class ChapaService {
  constructor() {
    this.secretKey =
      process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-4iDWR1X1eVZ46QvsqyVKGBmfgwOQW2p0';
    this.publicKey =
      process.env.CHAPA_PUBLIC_KEY || 'CHAPUBK_TEST-4yirqVofxjw14k4L6HkSkilMeMjFqGMJ';
  }

  /**
   * Initialize a new checkout transaction
   * @param {Object} params
   * @param {number} params.amount - Amount in ETB
   * @param {string} params.email - Member email address
   * @param {string} params.firstName - First name
   * @param {string} params.lastName - Last name
   * @param {string} [params.phoneNumber] - Phone number
   * @param {string} params.tx_ref - Unique merchant transaction reference
   * @param {string} [params.return_url] - Redirect URL after payment
   * @param {string} [params.callback_url] - Webhook callback URL
   * @param {string} [params.title] - Title on hosted page
   * @param {string} [params.description] - Description on hosted page
   * @returns {Promise<{ success: boolean, checkoutUrl: string, tx_ref: string }>}
   */
  async initialize({
    amount,
    currency = 'ETB',
    email,
    firstName = 'Gym',
    lastName = 'Member',
    phoneNumber,
    tx_ref,
    return_url,
    callback_url,
    title = 'GymPro Membership',
    description = 'GymPro Membership Plan Subscription',
  }) {
    if (!amount || amount <= 0) {
      throw new Error('Valid transaction amount is required');
    }
    if (!email) {
      throw new Error('Member email is required for payment initialization');
    }
    if (!tx_ref) {
      throw new Error('Transaction reference (tx_ref) is required');
    }

    const payload = {
      amount: String(amount),
      currency: currency || 'ETB',
      email: email.trim(),
      first_name: firstName.trim() || 'Gym',
      last_name: lastName.trim() || 'Member',
      phone_number: phoneNumber || '0911000000',
      tx_ref,
      return_url: return_url || undefined,
      callback_url: callback_url || undefined,
      'customization[title]': title,
      'customization[description]': description,
    };

    const response = await fetch(`${CHAPA_API_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.status !== 'success') {
      const errMsg =
        typeof data.message === 'object'
          ? JSON.stringify(data.message)
          : data.message || 'Chapa initialization failed';
      throw new Error(`Chapa Gateway Error: ${errMsg}`);
    }

    return {
      success: true,
      checkoutUrl: data.data?.checkout_url,
      tx_ref,
      raw: data,
    };
  }

  /**
   * Verify transaction status with Chapa API
   * @param {string} tx_ref - Merchant transaction reference
   * @returns {Promise<{ success: boolean, data?: Object, message?: string }>}
   */
  async verify(tx_ref) {
    if (!tx_ref) {
      throw new Error('tx_ref is required for verification');
    }

    const response = await fetch(`${CHAPA_API_URL}/transaction/verify/${encodeURIComponent(tx_ref)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.status !== 'success') {
      return {
        success: false,
        status: result.data?.status || 'failed',
        message: result.message || 'Transaction verification failed',
        data: result.data || null,
      };
    }

    const transactionData = result.data;
    const isPaid =
      transactionData &&
      (transactionData.status === 'success' || transactionData.status === 'completed');

    return {
      success: isPaid,
      status: transactionData?.status || 'unknown',
      amount: transactionData?.amount,
      currency: transactionData?.currency,
      reference: transactionData?.reference,
      data: transactionData,
    };
  }
}

export const chapaService = new ChapaService();
