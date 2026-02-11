// Routes pour les professionnels
import { Router } from 'express';
import { authenticatePro } from '../middleware/auth';
import * as proAuthController from '../controllers/proAuthController';
import * as missionController from '../controllers/missionController';
import * as locationController from '../controllers/locationController';

const router = Router();

// Routes d'authentification (publiques)
router.post('/auth/register', proAuthController.register);
router.post('/auth/login', proAuthController.login);
router.post('/auth/refresh', proAuthController.refreshToken);
router.post('/auth/logout', proAuthController.logout);

// Routes d'invitation (publiques)
router.get('/auth/invitation/:token', proAuthController.validateInvitation);
router.post('/auth/setup-account', proAuthController.setupAccount);

// Routes de réinitialisation de mot de passe (publiques)
router.post('/auth/forgot-password', proAuthController.forgotPassword);
router.post('/auth/reset-password', proAuthController.resetPassword);

// Routes protégées
router.get('/auth/me', authenticatePro, proAuthController.checkAuth);
router.put('/profile', authenticatePro, proAuthController.updateProfile);

// Routes des missions
router.get('/missions/available', authenticatePro, missionController.getAvailableMissions);
router.get('/missions/my', authenticatePro, missionController.getMyMissions);
router.get('/missions/history', authenticatePro, missionController.getMissionHistory);
router.post('/missions/:missionId/accept', authenticatePro, missionController.acceptMission);
router.post('/missions/:missionId/start', authenticatePro, missionController.startMission);
router.post('/missions/:missionId/complete', authenticatePro, missionController.completeMission);
router.post('/missions/:missionId/cancel', authenticatePro, missionController.cancelMission);

// Routes des gains
router.get('/earnings', authenticatePro, missionController.getEarnings);
router.get('/dashboard', authenticatePro, missionController.getDashboardStats);

// Routes de géolocalisation
router.post('/location/update', authenticatePro, locationController.updateLocation);
router.post('/location/start-sharing', authenticatePro, locationController.startLocationSharing);
router.post('/location/stop-sharing', authenticatePro, locationController.stopLocationSharing);
router.post('/push-token', authenticatePro, locationController.registerPushToken);

export default router;
