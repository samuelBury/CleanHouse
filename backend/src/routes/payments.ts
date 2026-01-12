// Routes des paiements
import { Router } from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  payWithSavedCard,
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  saveCardFromPayment,
  handleWebhook,
} from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';
import {
  validate,
  createPaymentIntentValidation,
  addPaymentMethodValidation,
  uuidParamValidation,
} from '../middleware/validation';

const router = Router();

// Webhook Stripe (pas d'authentification, vérifié par signature)
router.post('/webhook', handleWebhook);

// Routes protégées
router.use(authenticate);

// PaymentIntent
router.post('/create-intent', validate(createPaymentIntentValidation), createPaymentIntent);
router.post('/confirm', confirmPayment);
router.post('/pay-with-saved-card', payWithSavedCard);

// Sauvegarder la carte après un paiement
router.post('/save-card', saveCardFromPayment);

// Méthodes de paiement
router.get('/methods', getPaymentMethods);
router.post('/methods', validate(addPaymentMethodValidation), addPaymentMethod);
router.delete('/methods/:id', validate(uuidParamValidation), deletePaymentMethod);
router.put('/methods/:id/default', validate(uuidParamValidation), setDefaultPaymentMethod);

export default router;
