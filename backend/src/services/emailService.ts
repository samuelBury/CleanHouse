// Service d'emails (simulation - à intégrer avec SendGrid, Mailgun, etc.)

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Simulation d'envoi d'email (à remplacer par un vrai service)
export const sendEmail = async (data: EmailData): Promise<boolean> => {
  console.log('=== EMAIL SIMULATION ===');
  console.log(`To: ${data.to}`);
  console.log(`Subject: ${data.subject}`);
  console.log(`Body: ${data.text || data.html}`);
  console.log('========================');

  // En production, utiliser un service comme SendGrid, Mailgun, etc.
  // Exemple avec SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send(data);

  return true;
};

// Templates d'emails

// Email de bienvenue
export const sendWelcomeEmail = async (
  to: string,
  name: string
): Promise<boolean> => {
  return sendEmail({
    to,
    subject: 'Bienvenue chez CleanHouse !',
    html: `
      <h1>Bienvenue ${name} !</h1>
      <p>Nous sommes ravis de vous compter parmi nos clients.</p>
      <p>Avec CleanHouse, réservez facilement vos services de ménage et repassage.</p>
      <p>À très bientôt !</p>
      <p>L'équipe CleanHouse</p>
    `,
    text: `Bienvenue ${name} ! Nous sommes ravis de vous compter parmi nos clients.`,
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
  const resetUrl = `https://cleanhouse.app/reset-password?token=${resetToken}`;

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

// Email de facture
export const sendInvoiceEmail = async (
  to: string,
  name: string,
  invoice: {
    number: string;
    date: string;
    service: string;
    amount: number;
  }
): Promise<boolean> => {
  return sendEmail({
    to,
    subject: `Facture CleanHouse #${invoice.number}`,
    html: `
      <h1>Votre facture CleanHouse</h1>
      <p>Bonjour ${name},</p>
      <p>Veuillez trouver ci-dessous le détail de votre facture :</p>
      <table>
        <tr><td>Numéro :</td><td>${invoice.number}</td></tr>
        <tr><td>Date :</td><td>${invoice.date}</td></tr>
        <tr><td>Service :</td><td>${invoice.service}</td></tr>
        <tr><td>Montant :</td><td>${invoice.amount.toFixed(2)} EUR</td></tr>
      </table>
      <p>Merci de votre confiance !</p>
      <p>L'équipe CleanHouse</p>
    `,
    text: `Facture #${invoice.number} - ${invoice.service} - ${invoice.amount.toFixed(2)} EUR`,
  });
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendBookingConfirmationEmail,
  sendBookingReminderEmail,
  sendPasswordResetEmail,
  sendInvoiceEmail,
};
