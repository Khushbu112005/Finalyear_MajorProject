import Case from '../models/Case.js';
import Document from '../models/Document.js';

/**
 * @desc    Get cases (filtered by role and ownership)
 * @route   GET /api/cases
 * @access  Private (CITIZEN or LAWYER)
 */
export const getCases = async (req, res, next) => {
  try {
    const { status, priority, category, search, type } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role === 'CITIZEN') {
      query.citizen = req.user._id;
    } else if (req.user.role === 'LAWYER') {
      if (type === 'open') {
        query.lawyer = null;
        query.status = 'OPEN';
      } else if (type === 'all') {
        query.$or = [{ lawyer: req.user._id }, { lawyer: null, status: 'OPEN' }];
      } else {
        // Default to lawyer's assigned cases
        query.lawyer = req.user._id;
      }
    }

    // Additional query filters
    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (priority && priority !== 'ALL') {
      query.priority = priority;
    }
    if (category && category !== 'ALL') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const cases = await Case.find(query)
      .populate('citizen', 'name email phone')
      .populate('lawyer', 'name email specialization phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: cases.length,
      cases,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single case by ID with strict ownership authorization
 * @route   GET /api/cases/:id
 * @access  Private
 */
export const getCaseById = async (req, res, next) => {
  try {
    const singleCase = await Case.findById(req.params.id)
      .populate('citizen', 'name email phone address bio')
      .populate('lawyer', 'name email specialization phone barCouncilId');

    if (!singleCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found.',
      });
    }

    // AUTHORIZATION CHECK:
    // Citizen can only access their own case
    if (req.user.role === 'CITIZEN') {
      if (!singleCase.citizen._id.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to view this case.',
        });
      }
    }

    // Lawyer can only access case if assigned or if case is unassigned OPEN
    if (req.user.role === 'LAWYER') {
      const isAssigned = singleCase.lawyer && singleCase.lawyer._id.equals(req.user._id);
      const isAvailableOpen = !singleCase.lawyer && singleCase.status === 'OPEN';

      if (!isAssigned && !isAvailableOpen) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: This case is private or assigned to another legal counsel.',
        });
      }
    }

    // Fetch documents associated with this case
    const documents = await Document.find({ case: singleCase._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      case: singleCase,
      documents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new case
 * @route   POST /api/cases
 * @access  Private (CITIZEN only)
 */
export const createCase = async (req, res, next) => {
  try {
    const { title, description, category, priority, deadline, lawyer, location, courtReference } =
      req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both title and description for the case.',
      });
    }

    const newCase = await Case.create({
      title,
      description,
      citizen: req.user._id,
      lawyer: lawyer || null,
      category: category || 'General / Other',
      priority: priority || 'MEDIUM',
      deadline: deadline || null,
      location: location || '',
      courtReference: courtReference || '',
      status: 'OPEN',
    });

    const populatedCase = await Case.findById(newCase._id)
      .populate('citizen', 'name email phone')
      .populate('lawyer', 'name email specialization');

    res.status(201).json({
      success: true,
      message: 'Legal case created successfully.',
      case: populatedCase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a case
 * @route   PUT /api/cases/:id
 * @access  Private (Role-dependent ownership check)
 */
export const updateCase = async (req, res, next) => {
  try {
    const existingCase = await Case.findById(req.params.id);

    if (!existingCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found.',
      });
    }

    // AUTHORIZATION CHECK
    if (req.user.role === 'CITIZEN') {
      if (!existingCase.citizen.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only edit your own cases.',
        });
      }

      // Citizen can update general info
      const { title, description, category, priority, deadline, location, courtReference, status } =
        req.body;
      if (title) existingCase.title = title;
      if (description) existingCase.description = description;
      if (category) existingCase.category = category;
      if (priority) existingCase.priority = priority;
      if (deadline !== undefined) existingCase.deadline = deadline;
      if (location !== undefined) existingCase.location = location;
      if (courtReference !== undefined) existingCase.courtReference = courtReference;
      if (status && ['OPEN', 'CLOSED'].includes(status)) existingCase.status = status;
    } else if (req.user.role === 'LAWYER') {
      const isAssigned = existingCase.lawyer && existingCase.lawyer.equals(req.user._id);
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not the assigned legal counsel for this case.',
        });
      }

      // Lawyer can update status, lawyerNotes, priority, deadline
      const { status, lawyerNotes, priority, deadline, courtReference } = req.body;
      if (status) existingCase.status = status;
      if (lawyerNotes !== undefined) existingCase.lawyerNotes = lawyerNotes;
      if (priority) existingCase.priority = priority;
      if (deadline !== undefined) existingCase.deadline = deadline;
      if (courtReference !== undefined) existingCase.courtReference = courtReference;
    }

    const updatedCase = await existingCase.save();

    const populatedCase = await Case.findById(updatedCase._id)
      .populate('citizen', 'name email phone')
      .populate('lawyer', 'name email specialization phone');

    res.status(200).json({
      success: true,
      message: 'Case updated successfully.',
      case: populatedCase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign / Accept a case
 * @route   PUT /api/cases/:id/assign
 * @access  Private (LAWYER can accept, CITIZEN can assign)
 */
export const assignCase = async (req, res, next) => {
  try {
    const singleCase = await Case.findById(req.params.id);

    if (!singleCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found.',
      });
    }

    if (req.user.role === 'LAWYER') {
      // Lawyer claiming an open unassigned case
      if (singleCase.lawyer && !singleCase.lawyer.equals(req.user._id)) {
        return res.status(400).json({
          success: false,
          message: 'This case is already assigned to another lawyer.',
        });
      }

      singleCase.lawyer = req.user._id;
      if (singleCase.status === 'OPEN') {
        singleCase.status = 'IN_PROGRESS';
      }
    } else if (req.user.role === 'CITIZEN') {
      // Citizen assigning a specific lawyer
      if (!singleCase.citizen.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only assign lawyers to your own cases.',
        });
      }

      const { lawyerId } = req.body;
      singleCase.lawyer = lawyerId || null;
    }

    const savedCase = await singleCase.save();
    const populated = await Case.findById(savedCase._id)
      .populate('citizen', 'name email phone')
      .populate('lawyer', 'name email specialization');

    res.status(200).json({
      success: true,
      message:
        req.user.role === 'LAWYER'
          ? 'Case accepted and added to your active practice!'
          : 'Counsel assigned successfully.',
      case: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a case
 * @route   DELETE /api/cases/:id
 * @access  Private (CITIZEN owner only)
 */
export const deleteCase = async (req, res, next) => {
  try {
    const singleCase = await Case.findById(req.params.id);

    if (!singleCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found.',
      });
    }

    // Only owner citizen can delete
    if (!singleCase.citizen.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete your own cases.',
      });
    }

    // Only allow deletion if still OPEN
    if (singleCase.status === 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a case that is currently in progress with legal counsel.',
      });
    }

    // Delete associated documents
    await Document.deleteMany({ case: singleCase._id });

    await singleCase.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Case and associated document links removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};
