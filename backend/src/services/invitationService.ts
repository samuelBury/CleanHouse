// Service d'invitation pour les professionnels
import crypto from 'crypto';
import prisma from '../config/database';
import { sendEmail } from './emailService';
import { sendInvitationSMS } from './smsService';

// Durée de validité de l'invitation (7 jours)
const INVITATION_EXPIRY_DAYS = 7;

// Traductions des emails d'invitation
const emailTranslations: Record<string, {
  subject: string;
  greeting: (first: string, last: string) => string;
  intro: string;
  stepsTitle: string;
  step1: string;
  step2: string;
  step3: string;
  buttonText: string;
  validityNotice: string;
  supportText: string;
  footerTeam: string;
  footerAuto: string;
  sms: (first: string) => string;
}> = {
  fr: {
    subject: 'Bienvenue chez CleanHouse Pro - Créez votre compte',
    greeting: (first, last) => `Bienvenue ${first} ${last} !`,
    intro: 'Vous avez été invité(e) à rejoindre l\'équipe CleanHouse en tant que professionnel du ménage.',
    stepsTitle: 'Pour finaliser votre inscription :',
    step1: 'Cliquez sur le bouton ci-dessous pour créer votre compte',
    step2: 'Choisissez votre pseudonyme et mot de passe',
    step3: 'Téléchargez l\'application CleanHouse Pro et connectez-vous',
    buttonText: 'Créer mon compte',
    validityNotice: `Ce lien est valide pendant ${INVITATION_EXPIRY_DAYS} jours.`,
    supportText: 'En cas de problème, contactez notre équipe support à l\'adresse : support@cleanhouse.com',
    footerTeam: 'CleanHouse - L\'équipe administrative',
    footerAuto: 'Cet email a été envoyé automatiquement, merci de ne pas y répondre.',
    sms: (first) => `Bonjour ${first} ! Vous avez été invité(e) à rejoindre CleanHouse. Consultez votre email pour créer votre compte professionnel.`,
  },
  en: {
    subject: 'Welcome to CleanHouse Pro - Create your account',
    greeting: (first, last) => `Welcome ${first} ${last}!`,
    intro: 'You have been invited to join the CleanHouse team as a cleaning professional.',
    stepsTitle: 'To complete your registration:',
    step1: 'Click the button below to create your account',
    step2: 'Choose your username and password',
    step3: 'Download the CleanHouse Pro app and sign in',
    buttonText: 'Create my account',
    validityNotice: `This link is valid for ${INVITATION_EXPIRY_DAYS} days.`,
    supportText: 'If you have any issues, contact our support team at: support@cleanhouse.com',
    footerTeam: 'CleanHouse - Admin Team',
    footerAuto: 'This email was sent automatically, please do not reply.',
    sms: (first) => `Hello ${first}! You have been invited to join CleanHouse. Check your email to create your professional account.`,
  },
  ru: {
    subject: 'Добро пожаловать в CleanHouse Pro - Создайте аккаунт',
    greeting: (first, last) => `Добро пожаловать, ${first} ${last}!`,
    intro: 'Вы приглашены присоединиться к команде CleanHouse в качестве специалиста по уборке.',
    stepsTitle: 'Чтобы завершить регистрацию:',
    step1: 'Нажмите на кнопку ниже, чтобы создать аккаунт',
    step2: 'Выберите псевдоним и пароль',
    step3: 'Скачайте приложение CleanHouse Pro и войдите',
    buttonText: 'Создать аккаунт',
    validityNotice: `Эта ссылка действительна в течение ${INVITATION_EXPIRY_DAYS} дней.`,
    supportText: 'При возникновении проблем обратитесь в службу поддержки: support@cleanhouse.com',
    footerTeam: 'CleanHouse - Администрация',
    footerAuto: 'Это письмо отправлено автоматически, пожалуйста, не отвечайте на него.',
    sms: (first) => `Здравствуйте, ${first}! Вы приглашены в CleanHouse. Проверьте почту, чтобы создать профессиональный аккаунт.`,
  },
  ro: {
    subject: 'Bine ați venit la CleanHouse Pro - Creați-vă contul',
    greeting: (first, last) => `Bine ați venit, ${first} ${last}!`,
    intro: 'Ați fost invitat(ă) să vă alăturați echipei CleanHouse ca profesionist în curățenie.',
    stepsTitle: 'Pentru a finaliza înregistrarea:',
    step1: 'Faceți clic pe butonul de mai jos pentru a vă crea contul',
    step2: 'Alegeți-vă pseudonimul și parola',
    step3: 'Descărcați aplicația CleanHouse Pro și conectați-vă',
    buttonText: 'Creează contul meu',
    validityNotice: `Acest link este valabil ${INVITATION_EXPIRY_DAYS} zile.`,
    supportText: 'În caz de probleme, contactați echipa de suport la: support@cleanhouse.com',
    footerTeam: 'CleanHouse - Echipa administrativă',
    footerAuto: 'Acest email a fost trimis automat, vă rugăm să nu răspundeți.',
    sms: (first) => `Bună ${first}! Ați fost invitat(ă) să vă alăturați CleanHouse. Verificați emailul pentru a vă crea contul profesional.`,
  },
  pt: {
    subject: 'Bem-vindo ao CleanHouse Pro - Crie sua conta',
    greeting: (first, last) => `Bem-vindo(a) ${first} ${last}!`,
    intro: 'Você foi convidado(a) a se juntar à equipe CleanHouse como profissional de limpeza.',
    stepsTitle: 'Para concluir seu cadastro:',
    step1: 'Clique no botão abaixo para criar sua conta',
    step2: 'Escolha seu nome de usuário e senha',
    step3: 'Baixe o aplicativo CleanHouse Pro e faça login',
    buttonText: 'Criar minha conta',
    validityNotice: `Este link é válido por ${INVITATION_EXPIRY_DAYS} dias.`,
    supportText: 'Em caso de problemas, entre em contato com nosso suporte: support@cleanhouse.com',
    footerTeam: 'CleanHouse - Equipe administrativa',
    footerAuto: 'Este email foi enviado automaticamente, por favor não responda.',
    sms: (first) => `Olá ${first}! Você foi convidado(a) para o CleanHouse. Verifique seu email para criar sua conta profissional.`,
  },
  ar: {
    subject: 'مرحباً بك في CleanHouse Pro - أنشئ حسابك',
    greeting: (first, last) => `!${last} ${first} مرحباً`,
    intro: 'لقد تمت دعوتك للانضمام إلى فريق CleanHouse كمحترف في التنظيف.',
    stepsTitle: 'لإكمال التسجيل:',
    step1: 'انقر على الزر أدناه لإنشاء حسابك',
    step2: 'اختر اسم المستخدم وكلمة المرور',
    step3: 'حمّل تطبيق CleanHouse Pro وسجّل الدخول',
    buttonText: 'إنشاء حسابي',
    validityNotice: `هذا الرابط صالح لمدة ${INVITATION_EXPIRY_DAYS} أيام.`,
    supportText: 'في حالة وجود مشكلة، تواصل مع فريق الدعم: support@cleanhouse.com',
    footerTeam: 'CleanHouse - فريق الإدارة',
    footerAuto: 'تم إرسال هذا البريد تلقائياً، يرجى عدم الرد عليه.',
    sms: (first) => `مرحباً ${first}! لقد تمت دعوتك للانضمام إلى CleanHouse. تحقق من بريدك الإلكتروني لإنشاء حسابك المهني.`,
  },
  es: {
    subject: 'Bienvenido a CleanHouse Pro - Crea tu cuenta',
    greeting: (first, last) => `¡Bienvenido/a ${first} ${last}!`,
    intro: 'Has sido invitado/a a unirte al equipo CleanHouse como profesional de limpieza.',
    stepsTitle: 'Para completar tu registro:',
    step1: 'Haz clic en el botón de abajo para crear tu cuenta',
    step2: 'Elige tu nombre de usuario y contraseña',
    step3: 'Descarga la aplicación CleanHouse Pro e inicia sesión',
    buttonText: 'Crear mi cuenta',
    validityNotice: `Este enlace es válido durante ${INVITATION_EXPIRY_DAYS} días.`,
    supportText: 'Si tienes algún problema, contacta con nuestro equipo de soporte: support@cleanhouse.com',
    footerTeam: 'CleanHouse - Equipo administrativo',
    footerAuto: 'Este email fue enviado automáticamente, por favor no respondas.',
    sms: (first) => `¡Hola ${first}! Has sido invitado/a a unirte a CleanHouse. Revisa tu email para crear tu cuenta profesional.`,
  },
  zh: {
    subject: '欢迎加入 CleanHouse Pro - 创建您的账户',
    greeting: (first, last) => `欢迎 ${first} ${last}！`,
    intro: '您已被邀请加入 CleanHouse 团队，成为专业清洁人员。',
    stepsTitle: '完成注册步骤：',
    step1: '点击下方按钮创建您的账户',
    step2: '选择您的用户名和密码',
    step3: '下载 CleanHouse Pro 应用并登录',
    buttonText: '创建我的账户',
    validityNotice: `此链接有效期为 ${INVITATION_EXPIRY_DAYS} 天。`,
    supportText: '如有问题，请联系我们的支持团队：support@cleanhouse.com',
    footerTeam: 'CleanHouse - 管理团队',
    footerAuto: '此邮件为自动发送，请勿回复。',
    sms: (first) => `您好 ${first}！您已被邀请加入 CleanHouse。请查看邮箱以创建您的专业账户。`,
  },
};

const getTranslation = (lang: string) => emailTranslations[lang] || emailTranslations.fr;

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

  const lang = professional.language || 'fr';

  // Envoyer l'email d'invitation
  const emailSent = await sendInvitationEmail(professional, lang);

  // Envoyer le SMS d'invitation
  if (professional.phone) {
    const t = getTranslation(lang);
    await sendInvitationSMS(professional.phone, t.sms(professional.firstName));
  }

  return emailSent;
};

// Envoyer l'email d'invitation
export const sendInvitationEmail = async (professional: {
  email: string;
  firstName: string;
  lastName: string;
  invitationToken: string | null;
}, lang: string = 'fr'): Promise<boolean> => {
  if (!professional.invitationToken) {
    console.error('Pas de token d\'invitation pour ce professionnel');
    return false;
  }

  const t = getTranslation(lang);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  // URL de l'app Pro pour créer le compte
  const invitationUrl = `${process.env.PRO_APP_URL || 'cleanhouse-pro://'}setup-account?token=${professional.invitationToken}`;
  // URL web de fallback (avec lang pour afficher la page dans la bonne langue)
  const webUrl = `${process.env.ADMIN_URL || 'http://localhost:3001'}/pro/setup?token=${professional.invitationToken}&lang=${lang}`;

  return sendEmail({
    to: professional.email,
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
            <h2>${t.greeting(professional.firstName, professional.lastName)}</h2>
            <p>${t.intro}</p>

            <div class="info-box">
              <p><strong>${t.stepsTitle}</strong></p>
              <ol>
                <li>${t.step1}</li>
                <li>${t.step2}</li>
                <li>${t.step3}</li>
              </ol>
            </div>

            <p style="text-align: center;">
              <a href="${webUrl}" class="button">${t.buttonText}</a>
            </p>

            <p><strong>${t.validityNotice}</strong></p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

            <p>${t.supportText}</p>
          </div>
          <div class="footer">
            <p>${t.footerTeam}</p>
            <p>${t.footerAuto}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
${t.greeting(professional.firstName, professional.lastName)}

${t.intro}

${t.stepsTitle}
1. ${t.step1}
2. ${t.step2}
3. ${t.step3}

${t.buttonText}: ${webUrl}

${t.validityNotice}

${t.supportText}

${t.footerTeam}
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
    language: string;
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
      language: true,
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
      language: professional.language || 'fr',
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
