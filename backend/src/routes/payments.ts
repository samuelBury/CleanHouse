// Routes des paiements
import { Router } from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
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

// Méthodes de paiement
router.get('/methods', getPaymentMethods);
router.post('/methods', validate(addPaymentMethodValidation), addPaymentMethod);
router.delete('/methods/:id', validate(uuidParamValidation), deletePaymentMethod);
router.put('/methods/:id/default', validate(uuidParamValidation), setDefaultPaymentMethod);

export default router;
