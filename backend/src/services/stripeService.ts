// Service Stripe - Fonctions utilitaires pour les paiements
import stripe from '../config/stripe';
import Stripe from 'stripe';

export interface CreateCustomerData {
  email: string;
  name: string;
  userId: string;
}

export interface CreatePaymentIntentData {
  amount: number;
  customerId?: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
}

// Créer un customer Stripe
export const createCustomer = async (data: CreateCustomerData): Promise<Stripe.Customer> => {
  return stripe.customers.create({
    email: data.email,
    name: data.name,
    metadata: {
      userId: data.userId,
    },
  });
};

// Récupérer un customer par ID
export const getCustomer = async (customerId: string): Promise<Stripe.Customer | null> => {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return customer as Stripe.Customer;
  } catch {
    return null;
  }
};

// Créer un PaymentIntent
export const createPaymentIntent = async (
  data: CreatePaymentIntentData
): Promise<Stripe.PaymentIntent> => {
  return stripe.paymentIntents.create({
    amount: data.amount,
    currency: 'eur',
    customer: data.customerId,
    payment_method: data.paymentMethodId,
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: data.metadata || {},
  });
};

// Confirmer un PaymentIntent
export const confirmPaymentIntent = async (
  paymentIntentId: string,
  paymentMethodId?: string
): Promise<Stripe.PaymentIntent> => {
  return stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method: paymentMethodId,
  });
};

// Récupérer un PaymentIntent
export const getPaymentIntent = async (
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> => {
  return stripe.paymentIntents.retrieve(paymentIntentId);
};

// Annuler un PaymentIntent
export const cancelPaymentIntent = async (
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> => {
  return stripe.paymentIntents.cancel(paymentIntentId);
};

// Créer un remboursement
export const createRefund = async (
  paymentIntentId: string,
  amount?: number
): Promise<Stripe.Refund> => {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount, // Si undefined, remboursement total
  });
};

// Créer un SetupIntent pour sauvegarder une carte sans paiement
export const createSetupIntent = async (
  customerId: string
): Promise<Stripe.SetupIntent> => {
  return stripe.setupIntents.create({
    customer: customerId,
    automatic_payment_methods: {
      enabled: true,
    },
  });
};

// Attacher une méthode de paiement à un customer
export const attachPaymentMethod = async (
  paymentMethodId: string,
  customerId: string
): Promise<Stripe.PaymentMethod> => {
  return stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });
};

// Détacher une méthode de paiement
export const detachPaymentMethod = async (
  paymentMethodId: string
): Promise<Stripe.PaymentMethod> => {
  return stripe.paymentMethods.detach(paymentMethodId);
};

// Lister les méthodes de paiement d'un customer
export const listPaymentMethods = async (
  customerId: string
): Promise<Stripe.PaymentMethod[]> => {
  const methods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
  return methods.data;
};

// Définir la méthode de paiement par défaut
export const setDefaultPaymentMethod = async (
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.Customer> => {
  return stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
};

export default {
  createCustomer,
  getCustomer,
  createPaymentIntent,
  confirmPaymentIntent,
  getPaymentIntent,
  cancelPaymentIntent,
  createRefund,
  createSetupIntent,
  attachPaymentMethod,
  detachPaymentMethod,
  listPaymentMethods,
  setDefaultPaymentMethod,
};
