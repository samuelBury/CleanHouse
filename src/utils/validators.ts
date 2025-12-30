// Fonctions de validation pour CleanHouse
import { VALIDATION } from '../config/constants';

export const validators = {
  // Email validation
  isValidEmail(email: string): boolean {
    return VALIDATION.EMAIL.test(email.trim());
  },

  // Phone validation (French format)
  isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/\s/g, '');
    return VALIDATION.PHONE.test(cleaned);
  },

  // Password validation
  isValidPassword(password: string): boolean {
    return password.length >= VALIDATION.PASSWORD_MIN_LENGTH;
  },

  // Name validation
  isValidName(name: string): boolean {
    return name.trim().length >= 2;
  },

  // Card number validation (Luhn algorithm)
  isValidCardNumber(number: string): boolean {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.length !== 16) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  },

  // Expiry date validation
  isValidExpiryDate(date: string): boolean {
    const parts = date.split('/');
    if (parts.length !== 2) return false;

    const month = parseInt(parts[0], 10);
    const year = parseInt('20' + parts[1], 10);

    if (month < 1 || month > 12) return false;

    const now = new Date();
    const expiry = new Date(year, month - 1);

    return expiry > now;
  },

  // CVV validation
  isValidCVV(cvv: string): boolean {
    return /^\d{3,4}$/.test(cvv);
  },

  // Address validation
  isValidAddress(address: string): boolean {
    return address.trim().length >= 10;
  },

  // Duration validation
  isValidDuration(duration: number): boolean {
    return duration >= 1 && duration <= 8;
  },
};

// Validation error messages
export const validationMessages = {
  email: {
    required: 'Email requis',
    invalid: 'Email invalide',
  },
  password: {
    required: 'Mot de passe requis',
    tooShort: `Minimum ${VALIDATION.PASSWORD_MIN_LENGTH} caractères`,
    mismatch: 'Les mots de passe ne correspondent pas',
  },
  name: {
    required: 'Nom requis',
    tooShort: 'Minimum 2 caractères',
  },
  phone: {
    required: 'Téléphone requis',
    invalid: 'Numéro invalide',
  },
  card: {
    number: 'Numéro de carte invalide',
    expiry: "Date d'expiration invalide",
    cvv: 'CVV invalide',
    holder: 'Nom du titulaire requis',
  },
  address: {
    required: 'Adresse requise',
    tooShort: 'Adresse trop courte',
  },
};

export default validators;
