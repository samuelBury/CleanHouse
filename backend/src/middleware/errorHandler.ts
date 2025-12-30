// Middleware de gestion des erreurs
import { Request, Response, NextFunction } from 'express';

// Interface pour les erreurs personnalisées
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Créer une erreur personnalisée
export const createError = (
  message: string,
  statusCode: number = 500
): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

// Handler pour les routes non trouvées
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = createError(`Route non trouvée: ${req.originalUrl}`, 404);
  next(error);
};

// Handler principal des erreurs
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Erreur interne du serveur';

  // Log l'erreur en développement
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      statusCode,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
    }),
  });
};

// Helper pour wrapper les fonctions async
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
