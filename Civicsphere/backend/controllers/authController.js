import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

/**
 * @desc    Register a new user (CITIZEN or LAWYER)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, specialization, barCouncilId } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters in length.',
      });
    }

    // Validate role
    const validRoles = ['CITIZEN', 'LAWYER'];
    const userRole = role ? role.toUpperCase() : 'CITIZEN';
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role '${role}'. Role must be either 'CITIZEN' or 'LAWYER'.`,
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please login instead.',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: userRole,
      phone: phone || '',
      specialization: specialization || '',
      barCouncilId: barCouncilId || '',
    });

    if (user) {
      const token = generateToken(user._id, user.role);

      res.status(201).json({
        success: true,
        message: `Registration successful! Welcome to CivicSphere AI as a ${user.role}.`,
        token,
        user: user.toSafeObject(),
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data provided for registration.',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email and password presence
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Check for user by email (include password field)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user profile
 * @route   GET /api/auth/me
 * @access  Private (Protected by authMiddleware)
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    res.status(200).json({
      success: true,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Update allowed fields
    const { name, phone, bio, address, specialization, barCouncilId, experienceYears } = req.body;

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (address !== undefined) user.address = address;

    if (user.role === 'LAWYER') {
      if (specialization !== undefined) user.specialization = specialization;
      if (barCouncilId !== undefined) user.barCouncilId = barCouncilId;
      if (experienceYears !== undefined) user.experienceYears = Number(experienceYears);
    }

    // Check if password change requested
    if (req.body.currentPassword && req.body.newPassword) {
      const userWithPass = await User.findById(req.user._id).select('+password');
      const isMatch = await userWithPass.matchPassword(req.body.currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password does not match.',
        });
      }
      user.password = req.body.newPassword;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get directory of lawyers (for citizens to consult or assign)
 * @route   GET /api/auth/lawyers
 * @access  Private
 */
export const getLawyersList = async (req, res, next) => {
  try {
    const lawyers = await User.find({ role: 'LAWYER' })
      .select('name email phone specialization barCouncilId experienceYears bio createdAt')
      .lean();

    res.status(200).json({
      success: true,
      count: lawyers.length,
      lawyers,
    });
  } catch (error) {
    next(error);
  }
};
