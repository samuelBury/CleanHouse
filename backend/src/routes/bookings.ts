// Routes des réservations
import { Router } from 'express';
import {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  cancelBooking,
  getUpcomingBookings,
  getBookingHistory,
  getProLocationForMission,
  retryAssignment,
} from '../controllers/bookingController';
import { authenticate } from '../middleware/auth';
import {
  validate,
  createBookingValidation,
  updateBookingValidation,
  uuidParamValidation,
  paginationValidation,
} from '../middleware/validation';

const router = Router();

// Toutes les routes sont protégées
router.use(authenticate);

// Liste des réservations
router.get('/', validate(paginationValidation), getBookings);

// Réservations à venir (agenda)
router.get('/upcoming', getUpcomingBookings);

// Historique
router.get('/history', validate(paginationValidation), getBookingHistory);

// Créer une réservation
router.post('/', validate(createBookingValidation), createBooking);

// Obtenir une réservation spécifique
router.get('/:id', validate(uuidParamValidation), getBooking);

// Mettre à jour une réservation
router.put('/:id', validate(updateBookingValidation), updateBooking);

// Relancer l'auto-assignation
router.post('/:id/retry-assignment', validate(uuidParamValidation), retryAssignment);

// Annuler une réservation
router.delete('/:id', validate(uuidParamValidation), cancelBooking);

// Suivi du professionnel (localisation en temps réel)
router.get('/missions/:missionId/pro-location', getProLocationForMission);

export default router;
