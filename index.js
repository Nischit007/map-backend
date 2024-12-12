const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const User = require('./models/userModel');
const locationService = require('./services/locationService'); 

// Hardcoded environment variables
const JWT_SECRET = 'your-secret-key'; // Ideally should be kept in environment variables
const EMAIL_USER = 'testsmpt8@gmail.com';
const EMAIL_PASS = 'fsmz mjon veof xmth';
const FRONTEND_URL = 'http://localhost:5173';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = 8000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}




// Middleware
app.use(cors({
  origin: '*', // Allow all origins (can be replaced with specific origins)
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://nischitpantha:nisil123@cluster0.ldvejr0.mongodb.net/myDatabase?retryWrites=true&w=majority';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access token is missing or invalid.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token.' });
    req.user = user;
    next();
  });
};

// POST Route
app.post(
  '/api/locations',
  upload.fields([
    { name: 'heroSectionImage', maxCount: 1 },
    { name: 'AboutImage1', maxCount: 1 },
    { name: 'AboutImage2', maxCount: 1 },
    { name: 'issuedDetailImage1', maxCount: 1 },
    { name: 'issuedDetailImage2', maxCount: 1 },
    { name: 'gallery', maxCount: 50 },
  ]),
  async (req, res) => {
    try {
      const location = await locationService.createLocation(req.body, req.files);
      res.status(201).json({ message: 'Location added successfully!', location });
    } catch (error) {
      console.error('Error saving location:', error);
      res.status(500).json({ error: 'An error occurred while saving the location.' });
    }
  }
);

// PUT Route
app.put(
  '/api/locations/:id',
  authenticateToken,
  upload.fields([
    { name: 'heroSectionImage', maxCount: 1 },
    { name: 'AboutImage1', maxCount: 1 },
    { name: 'AboutImage2', maxCount: 1 },
    { name: 'issuedDetailImage1', maxCount: 1 },
    { name: 'issuedDetailImage2', maxCount: 1 },
    { name: 'gallery', maxCount: 50 },
  ]),
  async (req, res) => {
    try {
      const updatedLocation = await locationService.updateLocation(req.params.id, req.body, req.files);
      res.json({ message: 'Location updated successfully', location: updatedLocation });
    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({ message: 'Error updating location', error: error.message });
    }
  }
);

app.get('/api/locations', async (req, res) => {
  try {
    const locations = await locationService.getAllLocations();
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Error fetching locations', error: error.message });
  }
});

app.get('/api/locations/:id', async (req, res) => {
  const { id } = req.params; 
  console.log(id);
  
  try {
    const locations = await locationService.getLocationById(id); 
    res.json(locations); 
  } catch (error) {
    console.error('Error fetching locations:', error); // Log the error
    res.status(500).json({ message: 'Error fetching locations', error: error.message }); // Return a 500 response with an error message
  }
});


// Serve static files
app.use('/uploads', express.static(uploadsDir));

// Protected Delete route
app.delete('/api/locations/:id', authenticateToken, async (req, res) => {

  const { id } = req.params;
  try {
    await locationService.deleteLocation(id);
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ message: 'Error deleting location', error: error.message });
  }
});

// User Registration
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists.' });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// User Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password.' });

    // Compare the password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) return res.status(400).json({ message: 'Invalid email or password.' });

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1800h' });

    res.json({ token, userId: user._id });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send Password Reset Email
app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const resetToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '15m' });
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; 
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      tls: { rejectUnauthorized: false },
    });

    const mailOptions = {
      from: EMAIL_USER,
      to: email,
      subject: 'Password Reset',
      html: `<p>You requested for a password reset</p><p>Click this <a href="${FRONTEND_URL}/reset-password/${resetToken}">link</a> to reset your password</p>`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Password reset email sent.' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending reset email.', error: error.message });
  }
});

// Reset Password
app.post('/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();
    res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password.', error: error.message });
  }
});

// Validate JWT Token
const validateToken = (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access token is missing or invalid.' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token.' });
    }

    res.status(200).json({ message: 'Token is valid.', user });
  });
};

app.get('/auth/validate', validateToken);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
