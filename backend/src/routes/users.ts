// Routes utilisateurs
import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  getStats,
  deleteAccount,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { validate, paginationValidation } from '../middleware/validation';
import { body } from 'express-validator';

const router = Router();

// Toutes les routes sont protégées
router.use(authenticate);

// Profil
router.get('/me', getProfile);
router.put('/me', updateProfile);

// Mot de passe
router.put(
  '/me/password',
  validate([
    body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
      .matches(/[A-Z]/)
      .withMessage('Le nouveau mot de passe doit contenir au moins une majuscule')
      .matches(/[0-9]/)
      .withMessage('Le nouveau mot de passe doit contenir au moins un chiffre'),
  ]),
  changePassword
);

// Statistiques
router.get('/stats', getStats);

// Supprimer le compte
router.delete('/me', deleteAccount);

export default router;
