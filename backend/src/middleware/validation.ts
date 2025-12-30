// Middleware de validation des entrées
import { body, param, query, ValidationChain, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Vérifier les résultats de validation
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);

    if (errors.isEmpty()) {
      next();
      return;
    }

    res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array().map(err => ({
        field: 'path' in err ? err.path : 'unknown',
        message: err.msg,
      })),
    });
  };
};

// Validations pour l'authentification
export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/[A-Z]/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule')
    .matches(/[0-9]/)
    .withMessage('Le mot de passe doit contenir au moins un chiffre'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('phone')
    .optional()
    .isMobilePhone('fr-FR')
    .withMessage('Numéro de téléphone invalide'),
];

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis'),
];

export const socialAuthValidation = [
  body('idToken')
    .notEmpty()
    .withMessage('Token requis'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail(),
];

// Validations pour les réservations
export const createBookingValidation = [
  body('service')
    .isIn(['MENAGE', 'REPASSAGE', 'MENAGE_REPASSAGE'])
    .withMessage('Service invalide'),
  body('date')
    .isISO8601()
    .withMessage('Date invalide')
    .custom((value) => {
      const date = new Date(value);
      if (date < new Date()) {
        throw new Error('La date doit être dans le futur');
      }
      return true;
    }),
  body('time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Format d\'heure invalide (HH:MM)'),
  body('duration')
    .isInt({ min: 1, max: 8 })
    .withMessage('La durée doit être entre 1 et 8 heures'),
  body('address')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Adresse invalide'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude invalide'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude invalide'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes trop longues'),
];

export const updateBookingValidation = [
  param('id')
    .isUUID()
    .withMessage('ID de réservation invalide'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date invalide'),
  body('time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Format d\'heure invalide'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('La durée doit être entre 1 et 8 heures'),
  body('address')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Adresse invalide'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes trop longues'),
];

// Validations pour les paiements
export const createPaymentIntentValidation = [
  body('bookingId')
    .optional()
    .isUUID()
    .withMessage('ID de réservation invalide'),
  body('amount')
    .isInt({ min: 100 })
    .withMessage('Montant minimum: 1.00 EUR'),
];

export const addPaymentMethodValidation = [
  body('paymentMethodId')
    .notEmpty()
    .withMessage('ID de méthode de paiement requis'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault doit être un booléen'),
];

// Validations génériques
export const uuidParamValidation = [
  param('id')
    .isUUID()
    .withMessage('ID invalide'),
];

export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page invalide'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite invalide (1-100)'),
];
