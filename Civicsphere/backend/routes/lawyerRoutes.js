import express from 'express';
import { getLawyerDashboard, getLawyerClients } from '../controllers/lawyerController.js';
import protect from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes in this router are restricted to LAWYER role
router.use(protect);
router.use(authorizeRoles('LAWYER'));

router.get('/dashboard', getLawyerDashboard);
router.get('/clients', getLawyerClients);

export default router;
