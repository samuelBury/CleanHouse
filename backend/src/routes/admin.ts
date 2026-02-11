// Routes pour l'administration (dashboard SaaS)
import { Router } from 'express';
import multer from 'multer';
import { authenticateAdmin, requireSuperAdmin } from '../middleware/auth';
import { loadAdminZones, checkMissionAccess, checkProfessionalAccess } from '../middleware/zoneAccess';
import * as adminAuthController from '../controllers/adminAuthController';
import * as adminController from '../controllers/adminController';

const router = Router();

// Configuration Multer pour l'upload de fichiers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 Mo max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  },
});

// ============ AUTH ============
router.post('/auth/login', adminAuthController.login);
router.post('/auth/refresh', adminAuthController.refreshToken);
router.post('/auth/logout', adminAuthController.logout);
router.get('/auth/me', authenticateAdmin, adminAuthController.checkAuth);
router.post('/auth/create', authenticateAdmin, requireSuperAdmin, adminAuthController.createAdmin);

// ============ DASHBOARD ============
router.get('/dashboard', authenticateAdmin, loadAdminZones, adminController.getDashboardStats);

// ============ MISSIONS ============
router.get('/missions', authenticateAdmin, loadAdminZones, adminController.getMissions);
router.get('/missions/:missionId', authenticateAdmin, loadAdminZones, checkMissionAccess, adminController.getMissions);
router.get('/missions/:missionId/matches', authenticateAdmin, loadAdminZones, checkMissionAccess, adminController.getMissionMatches);
router.post('/missions/:missionId/assign', authenticateAdmin, loadAdminZones, checkMissionAccess, adminController.assignMission);
router.post('/missions/:missionId/reassign', authenticateAdmin, loadAdminZones, checkMissionAccess, adminController.reassignMission);
router.post('/missions/:missionId/cancel', authenticateAdmin, loadAdminZones, checkMissionAccess, adminController.cancelMission);
router.get('/missions/:missionId/location-history', authenticateAdmin, loadAdminZones, adminController.getMissionLocationHistory);

// ============ URGENCIES ============
router.get('/urgencies', authenticateAdmin, loadAdminZones, adminController.getUrgencies);
router.get('/urgencies/stats', authenticateAdmin, loadAdminZones, adminController.getUrgencyStats);
router.get('/urgencies/:urgencyId', authenticateAdmin, loadAdminZones, adminController.getUrgencyById);
router.post('/urgencies', authenticateAdmin, loadAdminZones, adminController.createUrgency);
router.post('/urgencies/:urgencyId/assign', authenticateAdmin, loadAdminZones, adminController.assignUrgencyToSelf);
router.post('/urgencies/:urgencyId/resolve', authenticateAdmin, loadAdminZones, adminController.resolveUrgency);

// ============ ZONES ============
router.get('/zones', authenticateAdmin, loadAdminZones, adminController.getZones);
router.get('/zones/:zoneId', authenticateAdmin, loadAdminZones, adminController.getZoneDetail);
router.post('/zones', authenticateAdmin, requireSuperAdmin, adminController.createZone);
router.put('/zones/:zoneId', authenticateAdmin, requireSuperAdmin, adminController.updateZone);
router.delete('/zones/:zoneId', authenticateAdmin, requireSuperAdmin, adminController.deleteZone);
router.post('/zones/:zoneId/professionals', authenticateAdmin, adminController.assignProToZone);
router.delete('/zones/:zoneId/professionals/:professionalId', authenticateAdmin, adminController.removeProFromZone);
router.post('/zones/:zoneId/admins', authenticateAdmin, requireSuperAdmin, adminController.assignAdminToZone);
router.delete('/zones/:zoneId/admins/:adminId', authenticateAdmin, requireSuperAdmin, adminController.removeAdminFromZone);

// ============ PROFESSIONNELS ============
router.get('/professionals', authenticateAdmin, loadAdminZones, adminController.getProfessionals);
router.get('/professionals/search', authenticateAdmin, loadAdminZones, adminController.findProsForPostalCode);
router.get('/professionals/locations', authenticateAdmin, loadAdminZones, adminController.getAllProsLocations);
router.get('/professionals/zones', authenticateAdmin, adminController.getAllProsZones);
router.post(
  '/professionals',
  authenticateAdmin,
  upload.fields([
    { name: 'contract', maxCount: 1 },
    { name: 'idDocument', maxCount: 1 },
    { name: 'proofOfAddress', maxCount: 1 },
    { name: 'carteVitale', maxCount: 1 },
    { name: 'avatar', maxCount: 1 },
  ]),
  adminController.createProfessional
);
router.get('/professionals/:professionalId', authenticateAdmin, loadAdminZones, checkProfessionalAccess, adminController.getProfessionalDetail);
router.put('/professionals/:professionalId/verify', authenticateAdmin, loadAdminZones, checkProfessionalAccess, adminController.verifyProfessional);
router.get('/professionals/:professionalId/notes', authenticateAdmin, loadAdminZones, checkProfessionalAccess, adminController.getProfessionalNotes);
router.post('/professionals/:professionalId/notes', authenticateAdmin, loadAdminZones, checkProfessionalAccess, adminController.addProfessionalNote);
router.post('/professionals/:professionalId/resend-invitation', authenticateAdmin, loadAdminZones, adminController.resendInvitation);
router.get('/professionals/:professionalId/location', authenticateAdmin, loadAdminZones, adminController.getProLocation);

// ============ CALENDRIER ============
router.get('/calendar/missions', authenticateAdmin, loadAdminZones, adminController.getCalendarMissions);

// ============ AUDIT LOGS ============
router.get('/audit-logs', authenticateAdmin, adminController.getAuditLogs);
router.get('/audit-logs/:entityType/:entityId', authenticateAdmin, adminController.getEntityHistory);

export default router;
