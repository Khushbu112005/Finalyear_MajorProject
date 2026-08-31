import Case from '../models/Case.js';
import Document from '../models/Document.js';

/**
 * @desc    Get citizen dashboard analytics and recent activity
 * @route   GET /api/citizen/dashboard
 * @access  Private (CITIZEN role only)
 */
export const getCitizenDashboard = async (req, res, next) => {
  try {
    const citizenId = req.user._id;

    // Count cases by status
    const totalCases = await Case.countDocuments({ citizen: citizenId });
    const openCases = await Case.countDocuments({ citizen: citizenId, status: 'OPEN' });
    const inProgressCases = await Case.countDocuments({
      citizen: citizenId,
      status: 'IN_PROGRESS',
    });
    const closedCases = await Case.countDocuments({
      citizen: citizenId,
      status: 'CLOSED',
    });

    // Total documents uploaded
    const totalDocuments = await Document.countDocuments({ uploadedBy: citizenId });

    // Upcoming deadlines (deadline is in future or today)
    const now = new Date();
    const upcomingDeadlines = await Case.find({
      citizen: citizenId,
      deadline: { $gte: now },
      status: { $ne: 'CLOSED' },
    })
      .sort({ deadline: 1 })
      .limit(5)
      .select('title category priority deadline status');

    // Recent cases
    const recentCases = await Case.find({ citizen: citizenId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('lawyer', 'name email specialization phone');

    // Recent documents
    const recentDocuments = await Document.find({ uploadedBy: citizenId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('case', 'title');

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalCases,
          openCases,
          inProgressCases,
          closedCases,
          totalDocuments,
          upcomingDeadlinesCount: upcomingDeadlines.length,
        },
        upcomingDeadlines,
        recentCases,
        recentDocuments,
      },
    });
  } catch (error) {
    next(error);
  }
};
