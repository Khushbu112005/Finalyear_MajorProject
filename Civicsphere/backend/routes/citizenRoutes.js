import express from 'express';
import { getCitizenDashboard } from '../controllers/citizenController.js';
import protect from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes in this router are restricted to CITIZEN role
router.use(protect);
router.use(authorizeRoles('CITIZEN'));

router.get('/dashboard', getCitizenDashboard);

export default router;
