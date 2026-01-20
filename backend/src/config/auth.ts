// Configuration de l'authentification JWT
import jwt, { SignOptions } from 'jsonwebtoken';

export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
  expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as string,
  refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string,
};

export interface TokenPayload {
  userId?: string;
  professionalId?: string;
  adminId?: string;
  email: string;
  type?: 'user' | 'professional' | 'admin';
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_CONFIG.expiresIn as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, JWT_CONFIG.secret, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_CONFIG.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, JWT_CONFIG.refreshSecret, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_CONFIG.secret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_CONFIG.refreshSecret) as TokenPayload;
};

// Calculer la date d'expiration du refresh token
export const getRefreshTokenExpiry = (): Date => {
  const expiresIn = JWT_CONFIG.refreshExpiresIn;
  const match = expiresIn.match(/^(\d+)([dhms])$/);

  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours par défaut
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    's': 1000,
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + value * multipliers[unit]);
};
