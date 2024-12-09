const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/userModel');
const nodemailer = require('nodemailer');

const authService = {
  async register(data) {
    const { email, password } = data;
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('Email already exists');
    
    const newUser = new User({ email, password });
    return await newUser.save();
  },

  async login(email, password) {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return { token, userId: user._id };
  },

  async resetPassword(email, newPassword) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    return await user.save();
  },

  async sendResetEmail(email) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS, // Your email password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset',
      html: `<p>You requested for a password reset</p>
             <p>Click this <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}">link</a> to reset your password</p>`,
    };

    await transporter.sendMail(mailOptions);
    return { message: 'Password reset email sent' };
  },
};

module.exports = authService;
