// Routes d'authentification
import { Router } from 'express';
import {
  register,
  login,
  loginWithGoogle,
  loginWithApple,
  refreshToken,
  logout,
  checkAuth,
  verifyEmail,
  resendVerification,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import {
  validate,
  registerValidation,
  loginValidation,
  socialAuthValidation,
} from '../middleware/validation';

const router = Router();

// Routes publiques
router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/google', validate(socialAuthValidation), loginWithGoogle);
router.post('/apple', validate(socialAuthValidation), loginWithApple);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Routes protégées
router.get('/check', authenticate, checkAuth);

export default router;
