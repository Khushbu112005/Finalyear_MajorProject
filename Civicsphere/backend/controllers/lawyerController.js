import Case from '../models/Case.js';
import Document from '../models/Document.js';
import User from '../models/User.js';

/**
 * @desc    Get lawyer dashboard analytics and assigned cases overview
 * @route   GET /api/lawyer/dashboard
 * @access  Private (LAWYER role only)
 */
export const getLawyerDashboard = async (req, res, next) => {
  try {
    const lawyerId = req.user._id;

    // Cases assigned to this lawyer
    const assignedCases = await Case.countDocuments({ lawyer: lawyerId });
    const activeCases = await Case.countDocuments({
      lawyer: lawyerId,
      status: { $in: ['OPEN', 'IN_PROGRESS'] },
    });
    const closedCases = await Case.countDocuments({ lawyer: lawyerId, status: 'CLOSED' });

    // Distinct clients (citizens) assigned to this lawyer
    const clientIds = await Case.find({ lawyer: lawyerId }).distinct('citizen');
    const activeClientsCount = clientIds.length;

    // Documents associated with lawyer's cases
    const lawyerCaseIds = await Case.find({ lawyer: lawyerId }).distinct('_id');
    const pendingDocumentsCount = await Document.countDocuments({
      case: { $in: lawyerCaseIds },
      status: { $ne: 'READY' },
    });

    // Upcoming deadlines
    const now = new Date();
    const upcomingDeadlines = await Case.find({
      lawyer: lawyerId,
      deadline: { $gte: now },
      status: { $ne: 'CLOSED' },
    })
      .sort({ deadline: 1 })
      .limit(5)
      .populate('citizen', 'name email phone')
      .select('title category priority deadline status citizen');

    // Recent assigned cases
    const recentCases = await Case.find({ lawyer: lawyerId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('citizen', 'name email phone');

    // Available unassigned open cases (pool for lawyers to take up)
    const availableOpenCases = await Case.find({
      lawyer: null,
      status: 'OPEN',
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('citizen', 'name email');

    res.status(200).json({
      success: true,
      data: {
        stats: {
          assignedCases,
          activeCases,
          closedCases,
          activeClientsCount,
          pendingDocumentsCount,
          upcomingDeadlinesCount: upcomingDeadlines.length,
          availableOpenCasesCount: availableOpenCases.length,
        },
        upcomingDeadlines,
        recentCases,
        availableOpenCases,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all unique clients associated with this lawyer's cases
 * @route   GET /api/lawyer/clients
 * @access  Private (LAWYER role only)
 */
export const getLawyerClients = async (req, res, next) => {
  try {
    const lawyerId = req.user._id;

    // Find all cases assigned to this lawyer
    const lawyerCases = await Case.find({ lawyer: lawyerId })
      .populate('citizen', 'name email phone address bio createdAt')
      .sort({ updatedAt: -1 });

    // Aggregate unique clients with their respective cases
    const clientMap = new Map();

    lawyerCases.forEach((c) => {
      if (!c.citizen) return;
      const citizenId = c.citizen._id.toString();

      if (!clientMap.has(citizenId)) {
        clientMap.set(citizenId, {
          client: c.citizen,
          totalCases: 0,
          activeCases: 0,
          closedCases: 0,
          cases: [],
          lastActivity: c.updatedAt,
        });
      }

      const clientEntry = clientMap.get(citizenId);
      clientEntry.totalCases += 1;
      if (c.status === 'CLOSED') {
        clientEntry.closedCases += 1;
      } else {
        clientEntry.activeCases += 1;
      }
      clientEntry.cases.push({
        _id: c._id,
        title: c.title,
        status: c.status,
        priority: c.priority,
        category: c.category,
        deadline: c.deadline,
        createdAt: c.createdAt,
      });

      if (new Date(c.updatedAt) > new Date(clientEntry.lastActivity)) {
        clientEntry.lastActivity = c.updatedAt;
      }
    });

    const clientsList = Array.from(clientMap.values());

    res.status(200).json({
      success: true,
      count: clientsList.length,
      clients: clientsList,
    });
  } catch (error) {
    next(error);
  }
};
