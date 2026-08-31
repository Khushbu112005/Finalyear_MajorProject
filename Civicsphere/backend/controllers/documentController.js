import Document from '../models/Document.js';
import Case from '../models/Case.js';

/**
 * @desc    Get documents accessible to the current user
 * @route   GET /api/documents
 * @access  Private
 */
export const getDocuments = async (req, res, next) => {
  try {
    const { caseId, status, category, search } = req.query;
    const query = {};

    if (caseId) {
      query.case = caseId;
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Role-based document scoping
    if (req.user.role === 'CITIZEN') {
      // Citizen sees docs they uploaded or related to their cases
      const citizenCaseIds = await Case.find({ citizen: req.user._id }).distinct('_id');
      query.$or = [{ uploadedBy: req.user._id }, { case: { $in: citizenCaseIds } }];
    } else if (req.user.role === 'LAWYER') {
      // Lawyer sees docs from their assigned cases or uploaded by them
      const lawyerCaseIds = await Case.find({ lawyer: req.user._id }).distinct('_id');
      query.$or = [{ uploadedBy: req.user._id }, { case: { $in: lawyerCaseIds } }];
    }

    const documents = await Document.find(query)
      .populate('uploadedBy', 'name email role')
      .populate('case', 'title status priority')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload / register a new document
 * @route   POST /api/documents
 * @access  Private
 */
export const uploadDocument = async (req, res, next) => {
  try {
    const { title, fileUrl, fileType, fileSize, caseId, category, description } = req.body;

    if (!title || !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide document title and file URL.',
      });
    }

    // If linked to a case, verify user has access to that case
    if (caseId) {
      const parentCase = await Case.findById(caseId);
      if (!parentCase) {
        return res.status(404).json({
          success: false,
          message: 'Associated case not found.',
        });
      }

      if (req.user.role === 'CITIZEN' && !parentCase.citizen.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only attach documents to your own cases.',
        });
      }

      if (
        req.user.role === 'LAWYER' &&
        (!parentCase.lawyer || !parentCase.lawyer.equals(req.user._id))
      ) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only attach documents to cases assigned to you.',
        });
      }
    }

    const document = await Document.create({
      title,
      fileUrl,
      fileType: fileType || 'application/pdf',
      fileSize: fileSize || 1024 * 150, // Default mock size 150KB
      uploadedBy: req.user._id,
      case: caseId || null,
      category: category || 'Legal Evidence',
      description: description || '',
      status: 'READY',
    });

    const populated = await Document.findById(document._id)
      .populate('uploadedBy', 'name email role')
      .populate('case', 'title status');

    res.status(201).json({
      success: true,
      message: 'Document stored successfully in CivicSphere vault.',
      document: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get document details by ID
 * @route   GET /api/documents/:id
 * @access  Private
 */
export const getDocumentById = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'name email role')
      .populate('case', 'title citizen lawyer status');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.',
      });
    }

    // Access authorization check
    const isUploader = document.uploadedBy._id.equals(req.user._id);
    let hasCaseAccess = false;

    if (document.case) {
      if (req.user.role === 'CITIZEN' && document.case.citizen?.equals(req.user._id)) {
        hasCaseAccess = true;
      }
      if (req.user.role === 'LAWYER' && document.case.lawyer?.equals(req.user._id)) {
        hasCaseAccess = true;
      }
    }

    if (!isUploader && !hasCaseAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view this document.',
      });
    }

    res.status(200).json({
      success: true,
      document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update document status (e.g. for AI pipeline simulation or verification)
 * @route   PUT /api/documents/:id/status
 * @access  Private
 */
export const updateDocumentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.',
      });
    }

    if (status) {
      document.status = status;
      await document.save();
    }

    res.status(200).json({
      success: true,
      message: 'Document status updated.',
      document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a document
 * @route   DELETE /api/documents/:id
 * @access  Private
 */
export const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.',
      });
    }

    // Only uploader can delete
    if (!document.uploadedBy.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete documents you uploaded.',
      });
    }

    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Document removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};
