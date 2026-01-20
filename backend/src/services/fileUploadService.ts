// Service d'upload de fichiers vers Firebase Storage
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import crypto from 'crypto';
import path from 'path';

// Initialiser Firebase Admin (une seule fois)
if (getApps().length === 0) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } else {
    // Mode développement sans Firebase configuré
    console.warn('[Firebase] Service account non configuré - uploads simulés');
  }
}

const bucket = getApps().length > 0 ? getStorage().bucket() : null;

export type DocumentType = 'contract' | 'id_document' | 'avatar' | 'other';

interface UploadResult {
  key: string;
  url: string;
}

// Générer un nom de fichier unique
const generateUniqueFileName = (originalName: string, type: DocumentType): string => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName);
  return `professionals/${type}/${timestamp}-${randomString}${ext}`;
};

// Upload un fichier vers Firebase Storage
export const uploadDocument = async (
  file: Express.Multer.File,
  type: DocumentType
): Promise<UploadResult> => {
  const key = generateUniqueFileName(file.originalname, type);

  // Mode simulation si Firebase non configuré
  if (!bucket) {
    console.log(`[Firebase] Upload simulé: ${key}`);
    return {
      key,
      url: `https://storage.googleapis.com/simulated-bucket/${key}`,
    };
  }

  const fileRef = bucket.file(key);

  await fileRef.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
    },
  });

  // Rendre le fichier public et obtenir l'URL
  await fileRef.makePublic();
  const url = `https://storage.googleapis.com/${bucket.name}/${key}`;

  return { key, url };
};

// Upload depuis un Buffer
export const uploadBuffer = async (
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  type: DocumentType
): Promise<UploadResult> => {
  const key = generateUniqueFileName(fileName, type);

  if (!bucket) {
    console.log(`[Firebase] Upload simulé: ${key}`);
    return {
      key,
      url: `https://storage.googleapis.com/simulated-bucket/${key}`,
    };
  }

  const fileRef = bucket.file(key);

  await fileRef.save(buffer, {
    metadata: {
      contentType: mimeType,
    },
  });

  await fileRef.makePublic();
  const url = `https://storage.googleapis.com/${bucket.name}/${key}`;

  return { key, url };
};

// Obtenir une URL signée temporaire (pour fichiers privés)
export const getSignedDocumentUrl = async (
  key: string,
  expiresIn: number = 3600 // 1 heure par défaut (en secondes)
): Promise<string> => {
  if (!bucket) {
    return `https://storage.googleapis.com/simulated-bucket/${key}`;
  }

  const fileRef = bucket.file(key);
  const [url] = await fileRef.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresIn * 1000,
  });

  return url;
};

// Supprimer un fichier
export const deleteDocument = async (key: string): Promise<void> => {
  if (!bucket) {
    console.log(`[Firebase] Suppression simulée: ${key}`);
    return;
  }

  const fileRef = bucket.file(key);
  await fileRef.delete();
};

// Extraire la clé depuis une URL Firebase Storage
export const extractKeyFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    // URL format: https://storage.googleapis.com/bucket-name/path/to/file
    const pathParts = urlObj.pathname.split('/');
    // Enlever le premier élément vide et le nom du bucket
    return pathParts.slice(2).join('/');
  } catch {
    return null;
  }
};

// Vérifier si c'est un type MIME autorisé
export const isAllowedMimeType = (
  mimeType: string,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
): boolean => {
  return allowedTypes.includes(mimeType);
};

// Vérifier la taille du fichier (en bytes)
export const isAllowedFileSize = (
  size: number,
  maxSize: number = 10 * 1024 * 1024 // 10 Mo par défaut
): boolean => {
  return size <= maxSize;
};

export default {
  uploadDocument,
  uploadBuffer,
  getSignedDocumentUrl,
  deleteDocument,
  extractKeyFromUrl,
  isAllowedMimeType,
  isAllowedFileSize,
};
