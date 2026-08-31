import express from 'express';
import {
  getDocuments,
  uploadDocument,
  getDocumentById,
  updateDocumentStatus,
  deleteDocument,
} from '../controllers/documentController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// All document routes require authentication
router.use(protect);

router.route('/').get(getDocuments).post(uploadDocument);
router.route('/:id').get(getDocumentById).delete(deleteDocument);
router.put('/:id/status', updateDocumentStatus);

export default router;
