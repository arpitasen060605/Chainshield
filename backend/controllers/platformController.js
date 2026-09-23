import Company from '../models/Company.js';
import User from '../models/User.js';

/**
 * @desc    Get all companies with associated company admin information
 * @route   GET /api/platform/companies
 * @access  Private (Platform Admin only)
 */
export const getPlatformCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });

    const formattedCompanies = await Promise.all(
      companies.map(async (c) => {
        // Find all Company Admins associated with this company
        const adminUsers = await User.find({
          companyId: c._id,
          role: { $in: ['admin', 'company_admin', 'ADMIN', 'COMPANY_ADMIN'] },
        }).select('-password');

        const companyAdmins = adminUsers.map((adminUser) => ({
          _id: adminUser._id,
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role === 'company_admin' ? 'admin' : adminUser.role,
          status: adminUser.status,
        }));

        return {
          _id: c._id,
          id: c._id,
          name: c.name,
          code: c.code,
          industry: c.industry,
          status: c.status,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          companyAdmins,
          companyAdmin: companyAdmins[0] || null,
          adminStatus: companyAdmins[0] ? companyAdmins[0].status : 'N/A',
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: formattedCompanies.length,
      companies: formattedCompanies,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get platform-wide dashboard statistics
 * @route   GET /api/platform/stats
 * @access  Private (Platform Admin only)
 */
export const getPlatformStats = async (req, res, next) => {
  try {
    const totalCompanies = await Company.countDocuments();
    const validCompanyIds = await Company.find().distinct('_id');

    const activeCompanyAdmins = await User.countDocuments({
      companyId: { $in: validCompanyIds },
      role: { $in: ['admin', 'company_admin'] },
      status: 'active',
    });
    const inactiveCompanyAdmins = await User.countDocuments({
      companyId: { $in: validCompanyIds },
      role: { $in: ['admin', 'company_admin'] },
      status: 'inactive',
    });
    const pendingCompanyAdmins = await User.countDocuments({
      companyId: { $in: validCompanyIds },
      role: { $in: ['admin', 'company_admin', 'ADMIN', 'COMPANY_ADMIN'] },
      status: { $in: ['pending', 'PENDING'] },
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalCompanies,
        activeCompanyAdmins,
        inactiveCompanyAdmins,
        pendingCompanyAdmins,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all pending Company Admin registrations
 * @route   GET /api/platform/pending-admins
 * @access  Private (Platform Admin only)
 */
export const getPendingCompanyAdmins = async (req, res, next) => {
  try {
    const validCompanyIds = await Company.find().distinct('_id');

    const pendingAdmins = await User.find({
      companyId: { $in: validCompanyIds },
      role: { $in: ['admin', 'company_admin', 'ADMIN', 'COMPANY_ADMIN'] },
      status: { $in: ['pending', 'PENDING'] },
    })
      .populate('companyId', 'name code')
      .select('-password')
      .sort({ createdAt: -1 });

    const formatted = pendingAdmins.map((u) => ({
      _id: u._id,
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role === 'company_admin' ? 'admin' : u.role,
      status: u.status,
      company: u.companyId,
      companyName: u.companyId ? u.companyId.name : 'N/A',
      companyCode: u.companyId ? u.companyId.code : 'N/A',
      createdAt: u.createdAt,
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      pendingAdmins: formatted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve or reject a pending Company Admin registration
 * @route   PUT /api/platform/company-admins/:id/status
 * @access  Private (Platform Admin only)
 */
export const updateCompanyAdminStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const targetStatus = String(status || '').toLowerCase();
    if (!['active', 'rejected', 'inactive'].includes(targetStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be active, rejected, or inactive.' });
    }

    const u = await User.findById(req.params.id);
    if (!u) {
      return res.status(404).json({ success: false, message: 'Company Admin user not found.' });
    }

    if (!['admin', 'company_admin'].includes(u.role)) {
      return res.status(400).json({ success: false, message: 'Target user is not a Company Admin.' });
    }

    u.status = targetStatus;
    await u.save();

    if (targetStatus === 'active' && u.companyId) {
      await Company.findByIdAndUpdate(u.companyId, { status: 'active' });
    }

    return res.status(200).json({
      success: true,
      message: `Company Admin ${u.name} status updated to ${targetStatus}`,
      user: {
        _id: u._id,
        id: u._id,
        name: u.name,
        email: u.email,
        companyId: u.companyId,
        role: u.role === 'company_admin' ? 'admin' : u.role,
        status: u.status,
      },
    });
  } catch (error) {
    next(error);
  }
};
