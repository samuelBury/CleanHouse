// Controller des paiements
import { Request, Response } from 'express';
import stripe, { STRIPE_WEBHOOK_SECRET } from '../config/stripe';
import prisma from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import Stripe from 'stripe';

// Créer un PaymentIntent
export const createPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { bookingId, amount } = req.body;

  // Récupérer l'utilisateur pour Stripe Customer
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw createError('Utilisateur non trouvé', 404);
  }

  // Créer ou récupérer le Stripe Customer
  let customerId: string | undefined;

  // Chercher si un customer Stripe existe déjà via un PaymentMethod
  const existingMethod = await prisma.paymentMethod.findFirst({
    where: { userId },
  });

  if (existingMethod) {
    // Récupérer le customer depuis le PaymentMethod Stripe
    const stripeMethod = await stripe.paymentMethods.retrieve(existingMethod.stripeId);
    customerId = stripeMethod.customer as string;
  }

  if (!customerId) {
    // Créer un nouveau customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId },
    });
    customerId = customer.id;
  }

  // Créer le PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount, // En centimes
    currency: 'eur',
    customer: customerId,
    metadata: {
      userId,
      bookingId: bookingId || '',
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.json({
    success: true,
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    },
  });
});

// Confirmer un paiement (après webhook ou confirmation frontend)
export const confirmPayment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { paymentIntentId, bookingId } = req.body;

  // Récupérer le PaymentIntent depuis Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    throw createError('Le paiement n\'a pas été confirmé', 400);
  }

  // Vérifier que le paiement appartient à l'utilisateur
  if (paymentIntent.metadata.userId !== userId) {
    throw createError('Paiement non autorisé', 403);
  }

  // Créer la transaction
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      type: 'expense',
      amount: paymentIntent.amount / 100, // Convertir en euros
      description: `Paiement réservation`,
      bookingId: bookingId || paymentIntent.metadata.bookingId || null,
      stripeId: paymentIntentId,
    },
  });

  // Mettre à jour le solde de l'utilisateur
  await prisma.user.update({
    where: { id: userId },
    data: { balance: { decrement: paymentIntent.amount / 100 } },
  });

  res.json({
    success: true,
    data: { transaction },
    message: 'Paiement confirmé avec succès',
  });
});

// Obtenir les méthodes de paiement
export const getPaymentMethods = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: { paymentMethods },
  });
});

// Ajouter une méthode de paiement
export const addPaymentMethod = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { paymentMethodId, isDefault = false } = req.body;

  // Récupérer les détails du PaymentMethod depuis Stripe
  const stripeMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

  if (!stripeMethod.card) {
    throw createError('Méthode de paiement invalide', 400);
  }

  // Si c'est la méthode par défaut, retirer le statut des autres
  if (isDefault) {
    await prisma.paymentMethod.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  // Vérifier si c'est la première méthode (sera par défaut)
  const existingMethods = await prisma.paymentMethod.count({ where: { userId } });
  const shouldBeDefault = isDefault || existingMethods === 0;

  // Créer la méthode de paiement en base
  const paymentMethod = await prisma.paymentMethod.create({
    data: {
      userId,
      stripeId: paymentMethodId,
      type: 'card',
      last4: stripeMethod.card.last4,
      brand: stripeMethod.card.brand,
      expMonth: stripeMethod.card.exp_month,
      expYear: stripeMethod.card.exp_year,
      isDefault: shouldBeDefault,
    },
  });

  res.status(201).json({
    success: true,
    data: { paymentMethod },
  });
});

// Supprimer une méthode de paiement
export const deletePaymentMethod = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  // Vérifier que la méthode appartient à l'utilisateur
  const paymentMethod = await prisma.paymentMethod.findFirst({
    where: { id, userId },
  });

  if (!paymentMethod) {
    throw createError('Méthode de paiement non trouvée', 404);
  }

  // Détacher de Stripe
  try {
    await stripe.paymentMethods.detach(paymentMethod.stripeId);
  } catch (error) {
    // Ignorer l'erreur si déjà détaché
    console.warn('PaymentMethod already detached from Stripe');
  }

  // Supprimer de la base
  await prisma.paymentMethod.delete({ where: { id } });

  // Si c'était la méthode par défaut, définir une autre
  if (paymentMethod.isDefault) {
    const nextMethod = await prisma.paymentMethod.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (nextMethod) {
      await prisma.paymentMethod.update({
        where: { id: nextMethod.id },
        data: { isDefault: true },
      });
    }
  }

  res.json({
    success: true,
    message: 'Méthode de paiement supprimée',
  });
});

// Définir une méthode par défaut
export const setDefaultPaymentMethod = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  // Vérifier que la méthode appartient à l'utilisateur
  const paymentMethod = await prisma.paymentMethod.findFirst({
    where: { id, userId },
  });

  if (!paymentMethod) {
    throw createError('Méthode de paiement non trouvée', 404);
  }

  // Retirer le statut par défaut des autres méthodes
  await prisma.paymentMethod.updateMany({
    where: { userId },
    data: { isDefault: false },
  });

  // Définir cette méthode comme par défaut
  await prisma.paymentMethod.update({
    where: { id },
    data: { isDefault: true },
  });

  res.json({
    success: true,
    message: 'Méthode de paiement par défaut mise à jour',
  });
});

// Webhook Stripe
export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Webhook signature verification failed');
    throw createError('Signature webhook invalide', 400);
  }

  // Traiter les événements
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent ${paymentIntent.id} succeeded`);

      // Créer automatiquement la transaction si elle n'existe pas
      const existingTransaction = await prisma.transaction.findFirst({
        where: { stripeId: paymentIntent.id },
      });

      if (!existingTransaction && paymentIntent.metadata.userId) {
        await prisma.transaction.create({
          data: {
            userId: paymentIntent.metadata.userId,
            type: 'expense',
            amount: paymentIntent.amount / 100,
            description: 'Paiement via Stripe',
            bookingId: paymentIntent.metadata.bookingId || null,
            stripeId: paymentIntent.id,
          },
        });
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent ${paymentIntent.id} failed`);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});
