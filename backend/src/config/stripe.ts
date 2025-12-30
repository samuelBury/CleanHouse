// Configuration Stripe
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Prix des services en centimes
export const SERVICE_PRICES = {
  MENAGE: 2500, // 25.00 EUR
  REPASSAGE: 2000, // 20.00 EUR
  MENAGE_REPASSAGE: 4000, // 40.00 EUR
};

export default stripe;
