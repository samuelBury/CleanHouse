// Service d'invitation pour les professionnels
import crypto from 'crypto';
import prisma from '../config/database';
import { sendEmail } from './emailService';
import { sendInvitationSMS } from './smsService';

// Durée de validité de l'invitation (7 jours)
const INVITATION_EXPIRY_DAYS = 7;

// Générer un token d'invitation unique
export const generateInvitationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Date d'expiration de l'invitation
export const getInvitationExpiry = (): Date => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + INVITATION_EXPIRY_DAYS);
  return expiry;
};

// Créer et envoyer une invitation
export const createAndSendInvitation = async (professionalId: string): Promise<boolean> => {
  const token = generateInvitationToken();
  const expires = getInvitationExpiry();

  // Mettre à jour le professionnel avec le token
  const professional = await prisma.professional.update({
    where: { id: professionalId },
    data: {
      invitationToken: token,
      invitationExpires: expires,
    },
  });

  // Envoyer l'email d'invitation
  const emailSent = await sendInvitationEmail(professional);

  // Envoyer le SMS d'invitation
  if (professional.phone) {
    await sendInvitationSMS(professional.phone, professional.firstName);
  }

  return emailSent;
};

// Envoyer l'email d'invitation
export const sendInvitationEmail = async (professional: {
  email: string;
  firstName: string;
  lastName: string;
  invitationToken: string | null;
}): Promise<boolean> => {
  if (!professional.invitationToken) {
    console.error('Pas de token d\'invitation pour ce professionnel');
    return false;
  }

  // URL de l'app Pro pour créer le compte
  const invitationUrl = `${process.env.PRO_APP_URL || 'cleanhouse-pro://'}setup-account?token=${professional.invitationToken}`;
  // URL web de fallback
  const webUrl = `${process.env.ADMIN_URL || 'http://localhost:3001'}/pro/setup?token=${professional.invitationToken}`;

  return sendEmail({
    to: professional.email,
    subject: 'Bienvenue chez CleanHouse Pro - Créez votre compte',
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
          .pro-badge {
            display: inline-block;
            background: #2196F3;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            margin-left: 8px;
          }
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
          .info-box {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CleanHouse <span class="pro-badge">PRO</span></div>
          </div>
          <div class="content">
            <h2>Bienvenue ${professional.firstName} ${professional.lastName} !</h2>
            <p>Vous avez été invité(e) à rejoindre l'équipe CleanHouse en tant que professionnel du ménage.</p>

            <div class="info-box">
              <p><strong>Pour finaliser votre inscription :</strong></p>
              <ol>
                <li>Cliquez sur le bouton ci-dessous pour créer votre compte</li>
                <li>Choisissez votre pseudonyme et mot de passe</li>
                <li>Téléchargez l'application CleanHouse Pro et connectez-vous</li>
              </ol>
            </div>

            <p style="text-align: center;">
              <a href="${webUrl}" class="button">Créer mon compte</a>
            </p>

            <p><strong>Ce lien est valide pendant ${INVITATION_EXPIRY_DAYS} jours.</strong></p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

            <p>En cas de problème, contactez notre équipe support à l'adresse : support@cleanhouse.com</p>
          </div>
          <div class="footer">
            <p>CleanHouse - L'équipe administrative</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Bienvenue ${professional.firstName} ${professional.lastName} !

Vous avez été invité(e) à rejoindre l'équipe CleanHouse en tant que professionnel du ménage.

Pour finaliser votre inscription :
1. Téléchargez l'application CleanHouse Pro
2. Cliquez sur ce lien pour créer votre mot de passe : ${webUrl}
3. Connectez-vous avec votre email et mot de passe

Ce lien est valide pendant ${INVITATION_EXPIRY_DAYS} jours.

En cas de problème, contactez support@cleanhouse.com

L'équipe CleanHouse
    `,
  });
};

// Valider un token d'invitation
export const validateInvitationToken = async (token: string): Promise<{
  valid: boolean;
  professional?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  error?: string;
}> => {
  const professional = await prisma.professional.findUnique({
    where: { invitationToken: token },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      invitationExpires: true,
      accountSetupComplete: true,
    },
  });

  if (!professional) {
    return {
      valid: false,
      error: 'Token d\'invitation invalide',
    };
  }

  if (professional.accountSetupComplete) {
    return {
      valid: false,
      error: 'Ce compte a déjà été configuré',
    };
  }

  if (professional.invitationExpires && professional.invitationExpires < new Date()) {
    return {
      valid: false,
      error: 'Cette invitation a expiré',
    };
  }

  return {
    valid: true,
    professional: {
      id: professional.id,
      email: professional.email,
      firstName: professional.firstName,
      lastName: professional.lastName,
    },
  };
};

// Renvoyer une invitation (générer un nouveau token)
export const resendInvitation = async (professionalId: string): Promise<boolean> => {
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
  });

  if (!professional) {
    throw new Error('Professionnel non trouvé');
  }

  if (professional.accountSetupComplete) {
    throw new Error('Ce compte a déjà été configuré');
  }

  return createAndSendInvitation(professionalId);
};

export default {
  generateInvitationToken,
  getInvitationExpiry,
  createAndSendInvitation,
  sendInvitationEmail,
  validateInvitationToken,
  resendInvitation,
};
