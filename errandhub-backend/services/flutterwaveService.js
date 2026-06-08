const axios = require('axios');
const crypto = require('crypto');

const FLW_BASE_URL = 'https://api.flutterwave.com/v3';

const flwApi = axios.create({
  baseURL: FLW_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamically attach the secret key per-request so it is always read
// from process.env (avoids capturing undefined at module load time).
flwApi.interceptors.request.use((config) => {
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!key) {
    console.error('FLUTTERWAVE_SECRET_KEY is not set in environment variables');
  }
  config.headers['Authorization'] = `Bearer ${key || ''}`;
  return config;
});

function generateTransactionReference() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomUUID().split('-')[0].toUpperCase();
  return `ERH-${timestamp}${random}`;
}

async function initializeTransaction({ tx_ref, amount, currency, customer, payment_options, redirect_url }) {
  try {
    const response = await flwApi.post('/payments', {
      tx_ref,
      amount,
      currency: currency || 'NGN',
      redirect_url: redirect_url || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/wallet?payment_status=completed`,
      customer: {
        email: customer.email,
        name: customer.name,
        phone_number: customer.phone_number,
      },
      payment_options: payment_options || 'card,ussd,banktransfer',
      meta: {
        source: 'errandhub',
      },
    });

    return {
      success: true,
      data: response.data,
      link: response.data?.data?.link,
    };
  } catch (error) {
    console.error('Flutterwave initialize error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

async function verifyTransaction(transactionId) {
  try {
    const response = await flwApi.get(`/transactions/${transactionId}/verify`);

    return {
      success: true,
      data: response.data?.data,
    };
  } catch (error) {
    console.error('Flutterwave verify error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

module.exports = {
  generateTransactionReference,
  initializeTransaction,
  verifyTransaction,
};
