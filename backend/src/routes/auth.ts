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
  const nodemailer = require('nodemailer');

  const config = {
    SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
    SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
    SMTP_USER: process.env.SMTP_USER ? '***configured***' : 'NOT SET',
    SMTP_PASS: process.env.SMTP_PASS ? '***configured***' : 'NOT SET',
  };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.json({ success: false, message: 'SMTP not configured', config });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.verify();

    // Envoyer un email de test
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: 'Test CleanHouse - Email fonctionne!',
      text: 'Si tu reçois ceci, le SMTP est bien configuré!',
    });

    res.json({ success: true, message: 'Email de test envoyé!', config });
  } catch (error: any) {
    res.json({ success: false, message: error.message, config });
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
