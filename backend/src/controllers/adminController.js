import User from '../models/User.js';

// return list of all users (non-admins and admins)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    return res.json({ success: true, count: users.length, users });
  } catch (error) {
    console.error('AdminController.getAllUsers error', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
