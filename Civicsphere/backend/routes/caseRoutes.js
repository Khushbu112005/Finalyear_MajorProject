import express from 'express';
import {
  getCases,
  getCaseById,
  createCase,
  updateCase,
  assignCase,
  deleteCase,
} from '../controllers/caseController.js';
import protect from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/roleMiddleware.js';

const router = express.Router();

// All case routes require authentication
router.use(protect);

router
  .route('/')
  .get(getCases)
  .post(authorizeRoles('CITIZEN'), createCase);

router
  .route('/:id')
  .get(getCaseById)
  .put(updateCase)
  .delete(authorizeRoles('CITIZEN'), deleteCase);

router.put('/:id/assign', assignCase);

export default router;
