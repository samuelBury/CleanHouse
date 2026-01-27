// Service d'envoi d'emails avec Nodemailer
import nodemailer from 'nodemailer';

// Configuration du transporteur SMTP avec timeout et pooling
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true pour 465, false pour autres ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true, // Utiliser un pool de connexions
  maxConnections: 5,
  maxMessages: 100,
  connectionTimeout: 10000, // 10 secondes max pour se connecter
  greetingTimeout: 10000,
  socketTimeout: 30000, // 30 secondes max pour l'envoi
});

// Vérifier la connexion SMTP au démarrage (seulement si configuré)
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter.verify((error) => {
    if (error) {
      console.error('Erreur de connexion SMTP:', error.message);
    } else {
      console.log('Service email prêt');
    }
  });
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Générer un token de vérification
export const generateVerificationToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Fonction d'envoi générique
export const sendEmail = async (data: EmailData): Promise<boolean> => {
  // Mode simulation si SMTP non configuré
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('=== EMAIL SIMULATION ===');
    console.log(`To: ${data.to}`);
    console.log(`Subject: ${data.subject}`);
    console.log(`Body: ${data.text || 'HTML content'}`);
    console.log('========================');
    return true;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"CleanHouse" <noreply@cleanhouse.com>',
      ...data,
    });
    console.log(`Email envoyé à ${data.to}`);
    return true;
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return false;
  }
};

// Wrapper avec timeout pour ne pas bloquer indéfiniment
export const sendEmailWithTimeout = async (
  emailFn: () => Promise<boolean>,
  timeoutMs: number = 5000
): Promise<boolean> => {
  const timeoutPromise = new Promise<boolean>((resolve) => {
    setTimeout(() => {
      console.log('Email sending timed out, continuing in background...');
      resolve(true); // Return true to not block the flow
    }, timeoutMs);
  });

  // Race between the email sending and the timeout
  return Promise.race([emailFn(), timeoutPromise]);
};

// Envoyer l'email de vérification
export const sendVerificationEmail = async (
  to: string,
  name: string,
  token: string
): Promise<boolean> => {
  const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${token}`;

  return sendEmail({
    to,
    subject: 'Vérifiez votre adresse email - CleanHouse',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .logo { font-size: 28px; font-weight: bold; color: #4cb04f; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 10px; }
          .button {
            display: inline-block;
            background: #4cb04f;
            color: white !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CleanHouse</div>
          </div>
          <div class="content">
            <h2>Bienvenue ${name} !</h2>
            <p>Merci de vous être inscrit sur CleanHouse, votre service de ménage à domicile.</p>
            <p>Pour activer votre compte et commencer à réserver vos prestations, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Vérifier mon email</a>
            </p>
            <p>Ou copiez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">${verificationUrl}</p>
            <p><strong>Ce lien expire dans 24 heures.</strong></p>
            <p>Si vous n'avez pas créé de compte sur CleanHouse, ignorez cet email.</p>
          </div>
          <div class="footer">
            <p>CleanHouse - Services de ménage à Paris</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Bienvenue ${name} !

Merci de vous être inscrit sur CleanHouse.

Pour activer votre compte, cliquez sur ce lien :
${verificationUrl}

Ce lien expire dans 24 heures.

Si vous n'avez pas créé de compte, ignorez cet email.
    `,
  });
};

// Email de bienvenue (après vérification)
export const sendWelcomeEmail = async (
  to: string,
  name: string
): Promise<boolean> => {
  return sendEmail({
    to,
    subject: 'Bienvenue chez CleanHouse !',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .logo { font-size: 28px; font-weight: bold; color: #4cb04f; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 10px; }
          .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CleanHouse</div>
          </div>
          <div class="content">
            <h2>Votre compte est activé !</h2>
            <p>Bonjour ${name},</p>
            <p>Votre adresse email a été vérifiée avec succès. Vous pouvez maintenant vous connecter et profiter de nos services.</p>
            <p>Avec CleanHouse, réservez facilement vos prestations de ménage et repassage à domicile.</p>
            <p>À bientôt !</p>
          </div>
          <div class="footer">
            <p>CleanHouse - Services de ménage à Paris</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Bienvenue ${name} ! Votre compte est activé. Vous pouvez maintenant vous connecter.`,
  });
};

// Email de confirmation de réservation
export const sendBookingConfirmationEmail = async (
  to: string,
  name: string,
  booking: {
    service: string;
    date: string;
    time: string;
    address: string;
    professional: string;
    price: number;
  }
): Promise<boolean> => {
  return sendEmail({
    to,
    subject: 'Confirmation de votre réservation CleanHouse',
    html: `
      <h1>Votre réservation est confirmée !</h1>
      <p>Bonjour ${name},</p>
      <p>Votre réservation a bien été enregistrée :</p>
      <ul>
        <li><strong>Service :</strong> ${booking.service}</li>
        <li><strong>Date :</strong> ${booking.date}</li>
        <li><strong>Heure :</strong> ${booking.time}</li>
        <li><strong>Adresse :</strong> ${booking.address}</li>
        <li><strong>Professionnel :</strong> ${booking.professional}</li>
        <li><strong>Prix :</strong> ${booking.price.toFixed(2)} EUR</li>
      </ul>
      <p>Merci de votre confiance !</p>
      <p>L'équipe CleanHouse</p>
    `,
    text: `Votre réservation de ${booking.service} pour le ${booking.date} à ${booking.time} est confirmée.`,
  });
};

// Email de rappel
export const sendBookingReminderEmail = async (
  to: string,
  name: string,
  booking: {
    service: string;
    date: string;
    time: string;
    professional: string;
  }
): Promise<boolean> => {
  return sendEmail({
    to,
    subject: 'Rappel - Prestation CleanHouse demain',
    html: `
      <h1>Rappel de votre réservation</h1>
      <p>Bonjour ${name},</p>
      <p>Nous vous rappelons que ${booking.professional} viendra demain pour votre ${booking.service}.</p>
      <ul>
        <li><strong>Date :</strong> ${booking.date}</li>
        <li><strong>Heure :</strong> ${booking.time}</li>
      </ul>
      <p>À demain !</p>
      <p>L'équipe CleanHouse</p>
    `,
    text: `Rappel : ${booking.professional} viendra demain à ${booking.time} pour votre ${booking.service}.`,
  });
};

// Email de réinitialisation de mot de passe
export const sendPasswordResetEmail = async (
  to: string,
  resetToken: string
): Promise<boolean> => {
  const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  return sendEmail({
    to,
    subject: 'Réinitialisation de votre mot de passe CleanHouse',
    html: `
      <h1>Réinitialisation de mot de passe</h1>
      <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
      <p><a href="${resetUrl}">Réinitialiser mon mot de passe</a></p>
      <p>Ce lien expire dans 1 heure.</p>
      <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
      <p>L'équipe CleanHouse</p>
    `,
    text: `Réinitialisez votre mot de passe : ${resetUrl}`,
  });
};

export default {
  generateVerificationToken,
  sendEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendBookingConfirmationEmail,
  sendBookingReminderEmail,
  sendPasswordResetEmail,
};
