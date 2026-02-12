// Service d'envoi d'emails avec Resend
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = 'CleanHouse <noreply@livmaid.com>';

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
  if (!process.env.RESEND_API_KEY) {
    console.log('=== EMAIL SIMULATION (RESEND_API_KEY not set) ===');
    console.log(`To: ${data.to}`);
    console.log(`Subject: ${data.subject}`);
    console.log('================================================');
    return true;
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
    });
    console.log(`Email envoyé à ${data.to}`, result);
    return true;
  } catch (error) {
    console.error('Erreur envoi email Resend:', error);
    return false;
  }
};

// Envoyer l'email de vérification
export const sendVerificationEmail = async (
  to: string,
  name: string,
  token: string
): Promise<boolean> => {
  const verificationUrl = `${process.env.APP_URL || 'https://cleanhouse-production.up.railway.app'}/api/auth/verify-email?token=${token}`;

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

// Traductions email de réinitialisation
const resetEmailTranslations: Record<string, {
  subject: string;
  title: string;
  requested: string;
  enterCode: string;
  expiry: string;
  ignore: string;
  text: (code: string) => string;
}> = {
  fr: {
    subject: 'Votre code de réinitialisation CleanHouse',
    title: 'Réinitialisation de mot de passe',
    requested: 'Vous avez demandé à réinitialiser votre mot de passe.',
    enterCode: 'Entrez ce code dans l\'application :',
    expiry: 'Ce code expire dans 1 heure.',
    ignore: 'Si vous n\'avez pas fait cette demande, ignorez cet email.',
    text: (code) => `Votre code de réinitialisation CleanHouse : ${code}\nCe code expire dans 1 heure.`,
  },
  en: {
    subject: 'Your CleanHouse reset code',
    title: 'Password reset',
    requested: 'You requested to reset your password.',
    enterCode: 'Enter this code in the app:',
    expiry: 'This code expires in 1 hour.',
    ignore: 'If you did not make this request, ignore this email.',
    text: (code) => `Your CleanHouse reset code: ${code}\nThis code expires in 1 hour.`,
  },
  ru: {
    subject: 'Ваш код сброса CleanHouse',
    title: 'Сброс пароля',
    requested: 'Вы запросили сброс пароля.',
    enterCode: 'Введите этот код в приложении:',
    expiry: 'Код действителен в течение 1 часа.',
    ignore: 'Если вы не делали этот запрос, проигнорируйте это письмо.',
    text: (code) => `Ваш код сброса CleanHouse: ${code}\nКод действителен 1 час.`,
  },
  ro: {
    subject: 'Codul dvs. de resetare CleanHouse',
    title: 'Resetarea parolei',
    requested: 'Ați solicitat resetarea parolei.',
    enterCode: 'Introduceți acest cod în aplicație:',
    expiry: 'Acest cod expiră în 1 oră.',
    ignore: 'Dacă nu ați făcut această solicitare, ignorați acest email.',
    text: (code) => `Codul dvs. de resetare CleanHouse: ${code}\nAcest cod expiră în 1 oră.`,
  },
  pt: {
    subject: 'O seu código de redefinição CleanHouse',
    title: 'Redefinição de palavra-passe',
    requested: 'Solicitou a redefinição da sua palavra-passe.',
    enterCode: 'Introduza este código na aplicação:',
    expiry: 'Este código expira em 1 hora.',
    ignore: 'Se não fez este pedido, ignore este email.',
    text: (code) => `O seu código de redefinição CleanHouse: ${code}\nEste código expira em 1 hora.`,
  },
  ar: {
    subject: 'رمز إعادة تعيين CleanHouse الخاص بك',
    title: 'إعادة تعيين كلمة المرور',
    requested: 'لقد طلبت إعادة تعيين كلمة المرور.',
    enterCode: 'أدخل هذا الرمز في التطبيق:',
    expiry: 'ينتهي هذا الرمز خلال ساعة واحدة.',
    ignore: 'إذا لم تقم بهذا الطلب، تجاهل هذا البريد.',
    text: (code) => `رمز إعادة تعيين CleanHouse: ${code}\nينتهي خلال ساعة واحدة.`,
  },
  es: {
    subject: 'Tu código de restablecimiento CleanHouse',
    title: 'Restablecimiento de contraseña',
    requested: 'Has solicitado restablecer tu contraseña.',
    enterCode: 'Introduce este código en la app:',
    expiry: 'Este código caduca en 1 hora.',
    ignore: 'Si no has hecho esta solicitud, ignora este email.',
    text: (code) => `Tu código de restablecimiento CleanHouse: ${code}\nEste código caduca en 1 hora.`,
  },
  zh: {
    subject: '您的 CleanHouse 重置码',
    title: '密码重置',
    requested: '您已请求重置密码。',
    enterCode: '在应用中输入此代码：',
    expiry: '此代码将在1小时后过期。',
    ignore: '如果您没有发出此请求，请忽略此邮件。',
    text: (code) => `您的 CleanHouse 重置码：${code}\n此代码将在1小时后过期。`,
  },
};

// Email de réinitialisation de mot de passe
export const sendPasswordResetEmail = async (
  to: string,
  resetToken: string,
  lang: string = 'fr'
): Promise<boolean> => {
  // Générer un code à 6 chiffres à partir du token
  const code = resetToken.substring(0, 6).toUpperCase();
  const t = resetEmailTranslations[lang] || resetEmailTranslations.fr;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return sendEmail({
    to,
    subject: t.subject,
    html: `
      <!DOCTYPE html>
      <html dir="${dir}">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; direction: ${dir}; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .logo { font-size: 28px; font-weight: bold; color: #4cb04f; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 10px; }
          .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4cb04f; text-align: center; padding: 20px; background: #fff; border-radius: 10px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CleanHouse Pro</div>
          </div>
          <div class="content">
            <h2>${t.title}</h2>
            <p>${t.requested}</p>
            <p>${t.enterCode}</p>
            <div class="code">${code}</div>
            <p><strong>${t.expiry}</strong></p>
            <p>${t.ignore}</p>
          </div>
          <div class="footer">
            <p>CleanHouse</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: t.text(code),
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
