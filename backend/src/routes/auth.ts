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
  forgotPassword,
  resetPassword,
  resetPasswordPage,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import {
  validate,
  registerValidation,
  loginValidation,
  socialAuthValidation,
} from '../middleware/validation';

const router = Router();

// Test email configuration (à supprimer en prod)
router.get('/test-email', async (req, res) => {
  const { Resend } = require('resend');

  if (!process.env.RESEND_API_KEY) {
    return res.json({ success: false, message: 'RESEND_API_KEY not configured' });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: 'CleanHouse <onboarding@resend.dev>',
      to: 'samy.bury@gmail.com',
      subject: 'Test CleanHouse - Email fonctionne!',
      text: 'Si tu reçois ceci, Resend est bien configuré!',
    });

    res.json({ success: true, message: 'Email de test envoyé!', result });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

// Routes publiques
router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/google', validate(socialAuthValidation), loginWithGoogle);
router.post('/apple', validate(socialAuthValidation), loginWithApple);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/reset-password', resetPasswordPage);

// Routes protégées
router.get('/check', authenticate, checkAuth);

export default router;
