// Controller des paiements
import { Request, Response } from 'express';
import stripe, { STRIPE_WEBHOOK_SECRET } from '../config/stripe';
import prisma from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import Stripe from 'stripe';

// Helper pour obtenir ou créer un Stripe Customer
const getOrCreateStripeCustomer = async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw createError('Utilisateur non trouvé', 404);
  }

  // Si l'utilisateur a déjà un stripeCustomerId, le retourner
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Sinon, créer un nouveau customer Stripe
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId },
  });

  // Sauvegarder le customerId
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
};

// Créer un PaymentIntent
export const createPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { bookingId, amount } = req.body;

  // Obtenir ou créer le Stripe Customer
  const customerId = await getOrCreateStripeCustomer(userId);

  // Créer le PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount, // En centimes
    currency: 'eur',
    customer: customerId,
    // Permettre la sauvegarde de la carte pour usage futur
    setup_future_usage: 'off_session',
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

// Payer avec une carte sauvegardée
export const payWithSavedCard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { paymentMethodId, amount, bookingId } = req.body;

  if (!paymentMethodId || !amount) {
    throw createError('PaymentMethod ID et montant requis', 400);
  }

  // Vérifier que la carte appartient à l'utilisateur
  const savedCard = await prisma.paymentMethod.findFirst({
    where: { stripeId: paymentMethodId, userId },
  });

  if (!savedCard) {
    throw createError('Carte non trouvée', 404);
  }

  // Obtenir le customer Stripe
  const customerId = await getOrCreateStripeCustomer(userId);

  // Créer et confirmer le PaymentIntent en une seule étape
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'eur',
    customer: customerId,
    payment_method: paymentMethodId,
    off_session: true,
    confirm: true,
    metadata: {
      userId,
      bookingId: bookingId || '',
    },
  });

  if (paymentIntent.status === 'succeeded') {
    res.json({
      success: true,
      data: {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      },
      message: 'Paiement réussi',
    });
  } else {
    throw createError(`Paiement échoué: ${paymentIntent.status}`, 400);
  }
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

  // Obtenir ou créer le Stripe Customer
  const customerId = await getOrCreateStripeCustomer(userId);

  // Récupérer les détails de la carte depuis Stripe d'abord
  const stripeMethodDetails = await stripe.paymentMethods.retrieve(paymentMethodId);

  if (!stripeMethodDetails.card) {
    throw createError('Méthode de paiement invalide', 400);
  }

  // Vérifier si une carte identique existe déjà (même last4, brand, expiration)
  const existingCard = await prisma.paymentMethod.findFirst({
    where: {
      userId,
      last4: stripeMethodDetails.card.last4,
      brand: stripeMethodDetails.card.brand,
      expMonth: stripeMethodDetails.card.exp_month,
      expYear: stripeMethodDetails.card.exp_year,
    },
  });

  if (existingCard) {
    throw createError('Cette carte est déjà enregistrée', 400);
  }

  // Attacher le PaymentMethod au Customer Stripe
  let stripeMethod: Stripe.PaymentMethod;
  try {
    stripeMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  } catch (error: any) {
    // Si déjà attaché, récupérer les infos
    if (error.code === 'resource_already_exists') {
      stripeMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    } else {
      throw createError(error.message || 'Erreur lors de l\'attachement de la carte', 400);
    }
  }

  // Si c'est la méthode par défaut, retirer le statut des autres
  if (isDefault) {
    await prisma.paymentMethod.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    // Définir comme méthode par défaut sur Stripe aussi
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  // Vérifier si c'est la première méthode (sera par défaut)
  const existingMethods = await prisma.paymentMethod.count({ where: { userId } });
  const shouldBeDefault = isDefault || existingMethods === 0;

  if (shouldBeDefault && existingMethods === 0) {
    // Première carte = carte par défaut sur Stripe
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

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
    message: 'Carte enregistrée avec succès',
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

// Sauvegarder la carte utilisée lors d'un paiement
export const saveCardFromPayment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    throw createError('PaymentIntent ID requis', 400);
  }

  // Récupérer le PaymentIntent depuis Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    throw createError('Le paiement n\'a pas été complété', 400);
  }

  // Vérifier que le paiement appartient à l'utilisateur
  if (paymentIntent.metadata.userId !== userId) {
    throw createError('Paiement non autorisé', 403);
  }

  const paymentMethodId = paymentIntent.payment_method as string;

  if (!paymentMethodId) {
    throw createError('Aucune méthode de paiement trouvée', 400);
  }

  // Récupérer les détails de la carte
  const stripeMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

  if (!stripeMethod.card) {
    throw createError('Méthode de paiement invalide', 400);
  }

  // Vérifier si une carte identique existe déjà (même last4, brand, expiration)
  const existingCard = await prisma.paymentMethod.findFirst({
    where: {
      userId,
      last4: stripeMethod.card.last4,
      brand: stripeMethod.card.brand,
      expMonth: stripeMethod.card.exp_month,
      expYear: stripeMethod.card.exp_year,
    },
  });

  if (existingCard) {
    return res.json({
      success: true,
      data: { paymentMethod: existingCard },
      message: 'Cette carte est déjà enregistrée',
    });
  }

  // Vérifier si c'est la première méthode (sera par défaut)
  const existingMethods = await prisma.paymentMethod.count({ where: { userId } });
  const shouldBeDefault = existingMethods === 0;

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

  // Si c'est la première carte, la définir comme défaut sur Stripe
  if (shouldBeDefault) {
    const customerId = await getOrCreateStripeCustomer(userId);
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  res.status(201).json({
    success: true,
    data: { paymentMethod },
    message: 'Carte enregistrée avec succès',
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
