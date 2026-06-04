// filepath: /server/index.js
// Polyfill globalThis.crypto for Node.js 18 compatibility with mongodb driver
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) globalThis.crypto = webcrypto;

import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import mongoose from 'mongoose';
import Build from './models/Build.js';
import Photo from './models/Photo.js';
import Submission from './models/Submission.js';
import Interesting from './models/Interesting.js';
import { storage as cloudinaryStorage, getFileUrl } from './lib/cloudinary.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv with explicit path
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || '')
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection failed:', err.message));

const app = express();
const PORT = process.env.PORT || 3001;

// Email client for submission notifications
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || 'joshua.thompson0010@gmail.com';

async function sendSubmissionNotification(submission) {
  if (!resend) {
    console.log('Email not configured — skipping notification');
    return;
  }
  try {
    const isItem = submission.type === 'for-sale-item';
    const subject = isItem
      ? `New For-Sale Item Submitted: ${submission.itemTitle || 'Untitled'}`
      : `New Build Submitted: ${submission.buildName || 'Untitled'}`;

    const html = `
      <h2>${subject}</h2>
      <table style="border-collapse:collapse;">
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Type:</td><td>${isItem ? 'For Sale Item' : 'Build'}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Name:</td><td>${submission.name || '—'}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Email:</td><td>${submission.email}</td></tr>
        ${isItem ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Item:</td><td>${submission.itemTitle || '—'}</td></tr>` : ''}
        ${isItem ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Category:</td><td>${submission.itemCategory || '—'}</td></tr>` : ''}
        ${!isItem ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Build Name:</td><td>${submission.buildName || '—'}</td></tr>` : ''}
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Photos:</td><td>${submission.images?.length || 0}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Submitted:</td><td>${new Date(submission.createdDate).toLocaleString()}</td></tr>
      </table>
      <br>
      <p>Log in to the <a href="https://ugliboats.com/#/admin">Admin Dashboard</a> to review and approve this submission.</p>
    `;

    const { error } = await resend.emails.send({
      from: 'UgliBoats Notifications <noreply@ugliboats.com>',
      to: ADMIN_NOTIFY_EMAIL,
      subject,
      html,
    });
    if (error) throw new Error(error.message);
    console.log('Submission notification email sent to', ADMIN_NOTIFY_EMAIL);
  } catch (err) {
    console.error('Failed to send notification email:', err.message);
  }
}

// Store the current valid session token (in-memory for single admin)
let currentValidToken = null;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app build
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));

// Serve assets with ugli-boats-v2 prefix (for build compatibility)
app.use('/ugli-boats-v2', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Local uploads directory — used as static-file fallback when Cloudinary is not configured
const uploadsDir = path.join(__dirname, 'uploads');

// Serve uploaded files using the absolute path
app.use('/uploads', express.static(uploadsDir)); // Serve uploaded files
app.use('/ugli-boats-v2/uploads', express.static(uploadsDir)); // Serve uploaded files for GitHub Pages
app.use('/ugli-boats-v2/IMAGES', express.static(path.join(__dirname, '../public/IMAGES'))); // Serve legacy images for GitHub Pages





// Configure multer — uses Cloudinary in production, local disk in development
const upload = multer({
  storage: cloudinaryStorage,
  limits: {
    fileSize: 99 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});



// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'UGLI Boats API Server is running!',
    environment: process.env.NODE_ENV || 'development',
    hasJWT: !!process.env.JWT_SECRET,
    hasPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    uploadsPath: uploadsDir,
    uploadsExists: fs.existsSync(uploadsDir),
    workingDirectory: process.cwd()
  });
});

// Route health check endpoint
app.get('/api/health/routes', (req, res) => {
  try {
    const routes = [];
    
    // Check basic file operations
    const photosExist = fs.existsSync(photosFile);
    const buildsExist = fs.existsSync(buildsFile);
    const submissionsExist = fs.existsSync(submissionsFile);
    const interestingExist = fs.existsSync(interestingFile);
    const uploadsExist = fs.existsSync(uploadsDir);
    
    // Test data read operations
    let photosCount = 0;
    let buildsCount = 0;
    let submissionsCount = 0;
    let interestingCount = 0;
    
    try {
      photosCount = readPhotos().length;
      buildsCount = readBuilds().length;
      submissionsCount = readSubmissions().length;
      interestingCount = readInteresting().length;
    } catch (error) {
      console.error('Data read error:', error);
    }
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      files: {
        photos: { exists: photosExist, count: photosCount },
        builds: { exists: buildsExist, count: buildsCount },
        submissions: { exists: submissionsExist, count: submissionsCount },
        interesting: { exists: interestingExist, count: interestingCount },
        uploads: { exists: uploadsExist }
      },
      routes: {
        auth: ['/api/auth/login', '/api/auth/verify', '/api/auth/logout'],
        photos: ['/api/photos', '/api/photos/:category', '/api/photos/upload'],
        builds: ['/api/builds', '/api/builds/:id'],
        submissions: ['/api/submissions', '/api/submissions/:id/approve'],
        interesting: ['/api/interesting'],
        admin: ['/api/admin/upload']
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// === AUTHENTICATION ENDPOINTS ===

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    
    // Compare with hashed password from environment
    const hashedPassword = process.env.ADMIN_PASSWORD_HASH;
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!hashedPassword || !jwtSecret) {
      console.error('Missing ADMIN_PASSWORD_HASH or JWT_SECRET in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const isValidPassword = await bcrypt.compare(password, hashedPassword);
    
    if (!isValidPassword) {
      // Add a small delay to prevent brute force attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Check if someone is already logged in (Option B: Block new logins)
    if (currentValidToken !== null) {
      // Verify the existing token is still valid
      try {
        jwt.verify(currentValidToken, jwtSecret);
        // Token is still valid, block new login
        return res.status(423).json({ 
          error: 'Admin already logged in. Please try again later or contact the current admin to logout.',
          code: 'ADMIN_ALREADY_ACTIVE'
        });
      } catch (tokenError) {
        // Existing token is expired/invalid, allow new login
        currentValidToken = null;
      }
    }
    
    // Generate JWT token (expires in 24 hours)
    const token = jwt.sign(
      { admin: true, iat: Date.now() },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // Store as the current valid token
    currentValidToken = token;
    
    res.json({
      message: 'Login successful',
      token: token,
      expiresIn: '24h'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token endpoint
app.post('/api/auth/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Check if this is the current valid token (single session security)
    if (currentValidToken !== null && token !== currentValidToken) {
      return res.status(401).json({ error: 'Session expired or invalid.' });
    }
    
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const decoded = jwt.verify(token, jwtSecret);
    
    if (!decoded.admin) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.json({ 
      message: 'Token valid', 
      admin: true,
      expiresAt: new Date(decoded.exp * 1000)
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  try {
    // For single-admin system, clear session regardless of token match
    // This allows recovery if tokens get out of sync
    if (currentValidToken !== null) {
      currentValidToken = null;
    }
    
    res.json({ message: 'Logout successful' });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Middleware to verify admin token for protected routes
const verifyAdminToken = (req, res, next) => {
  try {
    console.log('===== AUTH TOKEN VERIFICATION =====');
    console.log('Request URL:', req.url);
    console.log('Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.log('Auth failed: No token provided');
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    console.log('Token received (first 20 chars):', token.substring(0, 20) + '...');
    console.log('Current valid token exists:', !!currentValidToken);
    console.log('Token matches current valid token:', currentValidToken === token);

    // Check if this is the current valid token (single session security)
    if (currentValidToken !== null && token !== currentValidToken) {
      console.log('Auth failed: Session expired or invalid token mismatch');
      return res.status(401).json({ error: 'Access denied. Session expired or invalid.' });
    }
    
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.log('Auth failed: No JWT_SECRET configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    console.log('JWT_SECRET configured:', !!jwtSecret);
    
    const decoded = jwt.verify(token, jwtSecret);
    console.log('Token decoded successfully:', !!decoded.admin);
    
    if (!decoded.admin) {
      console.log('Auth failed: Invalid admin flag in token');
      return res.status(401).json({ error: 'Access denied. Invalid token.' });
    }
    
    console.log('Auth successful, proceeding to route handler');
    req.admin = decoded;
    next();
    
  } catch (error) {
    console.log('Auth error:', error.name, error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access denied. Token expired.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Access denied. Invalid token.' });
    }
    
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Access denied. Token verification failed.' });
  }
};

// Custom middleware to handle multer errors
const handleMulterUpload = (req, res, next) => {
  console.log('===== MULTER UPLOAD MIDDLEWARE =====');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Content-Length:', req.headers['content-length']);
  
  upload.array('photos', 10)(req, res, (err) => {
    if (err) {
      console.log('Multer error:', err.message, err.code);
      console.log('Error details:', err);
      return res.status(400).json({ 
        error: 'File upload error: ' + err.message,
        code: err.code 
      });
    }
    console.log('Multer completed successfully, files:', req.files?.length || 0);
    next();
  });
};

// Upload photos
app.post('/api/photos/upload', verifyAdminToken, handleMulterUpload, async (req, res) => {
  try {
    const { category, metadata } = req.body;
    
    // Debug logging
    console.log('===== PHOTO UPLOAD REQUEST =====');
    console.log('Category:', category);
    console.log('Metadata:', metadata);
    console.log('Files count:', req.files ? req.files.length : 0);
    console.log('All body keys:', Object.keys(req.body));
    console.log('Environment check:');
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('UPLOAD_DIR:', process.env.UPLOAD_DIR);
    console.log('Uploads directory exists:', fs.existsSync('uploads'));
    
    let captions = [];
    let alts = [];
    
    // Try to parse metadata JSON first
    if (metadata) {
      try {
        const parsedMetadata = JSON.parse(metadata);
        captions = parsedMetadata.captions || [];
        alts = parsedMetadata.alts || [];
        console.log('Parsed metadata - captions:', captions, 'alts:', alts);
      } catch (e) {
        console.log('Failed to parse metadata JSON:', e);
      }
    }
    
    // Fallback to individual fields
    if (captions.length === 0 || alts.length === 0) {
      // Look for caption_0, caption_1, etc.
      for (let i = 0; i < (req.files ? req.files.length : 0); i++) {
        const caption = req.body[`caption_${i}`] || '';
        const alt = req.body[`alt_${i}`] || '';
        captions.push(caption);
        alts.push(alt);
      }
      console.log('Using individual fields - captions:', captions, 'alts:', alts);
    }
    
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    // Save new photos to MongoDB
    const uploadedFiles = await Promise.all(req.files.map(async (file, index) => {
      const newPhoto = {
        id: uuidv4(),
        image: getFileUrl(file),
        alt: alts[index] || `${category} - ${file.originalname}`,
        category: category,
        caption: captions[index] || '',
        uploadDate: new Date().toISOString()
      };
      console.log(`Photo ${index}:`, newPhoto);
      await new Photo(newPhoto).save();
      return newPhoto;
    }));
    
    res.json({
      message: `Successfully uploaded ${uploadedFiles.length} photos`,
      files: uploadedFiles
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      path: error.path
    });
    res.status(500).json({ 
      error: 'Upload failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all photos by category
app.get('/api/photos/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const photos = await Photo.find({ category }).sort({ uploadDate: -1 }).lean();
    res.json(photos);
  } catch (error) {
    console.error('Error getting photos:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all photos
app.get('/api/photos', async (req, res) => {
  try {
    const photos = await Photo.find({}).sort({ category: 1, uploadDate: -1 }).lean();
    res.json(photos);
  } catch (error) {
    console.error('Error getting photos:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete a photo
app.delete('/api/photos/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPhoto = await Photo.findOneAndDelete({ id }).lean();
    
    if (!deletedPhoto) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    res.json({ message: 'Photo deleted successfully', deletedPhoto });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Update a photo
app.put('/api/photos/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { alt, caption, category } = req.body;
    
    const updatedPhoto = await Photo.findOneAndUpdate(
      { id },
      { $set: { ...(alt && { alt }), ...(caption !== undefined && { caption }), ...(category && { category }) } },
      { new: true }
    ).lean();
    
    if (!updatedPhoto) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    res.json({ message: 'Photo updated successfully', updatedPhoto });
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(500).json({ error: 'Failed to update photo' });
  }
});

// Add a new build
app.post('/api/builds', upload.array('images', 20), async (req, res) => {
  try {
    const { name, buildName, header, introText, email, forSale, images, captions } = req.body;

    if (!buildName) {
      return res.status(400).json({ error: 'Build name is required' });
    }
    
    // Read existing builds
    const builds = await Build.find({}).lean();
    
    // Parse forSale data if provided
    let forSaleData = null;
    if (forSale) {
      try {
        forSaleData = typeof forSale === 'string' ? JSON.parse(forSale) : forSale;
      } catch (e) {
        console.log('Invalid forSale format, ignoring');
      }
    }
    
    // Parse captions array if provided
    let captionsArray = [];
    if (captions) {
      try {
        captionsArray = Array.isArray(captions) ? captions : [captions];
      } catch (e) {
        console.log('Invalid captions format, using empty captions');
      }
    }
    
    // Create new build 
    const newBuild = {
      id: uuidv4(),
      name,
      buildName,
      header: header || "",
      introText: introText || '',
      email,
      forSale: forSaleData,
      images: req.files ? req.files.map((f, index) => ({
        alt: f.originalname.replace(/\.[^/.]+$/, ""),
        caption: captionsArray[index] || '',
        url: getFileUrl(f)
      })) : (images || []),
      createdDate: new Date().toISOString()
    };
    
    await new Build(newBuild).save();
    
    res.json({
      message: 'Build added successfully',
      build: newBuild
    });
    
  } catch (error) {
    console.error('Build creation error:', error);
    res.status(500).json({ error: 'Failed to create build' });
  }
});

// Update a build
app.put('/api/builds/:id', verifyAdminToken, async (req, res) => {
  try {
    const buildId = req.params.id;
    const updatedData = req.body;
    
    const updatedBuild = await Build.findOneAndUpdate(
      { id: buildId },
      { $set: { ...updatedData, updatedDate: new Date().toISOString() } },
      { new: true }
    ).lean();
    
    if (!updatedBuild) {
      return res.status(404).json({ error: 'Build not found' });
    }
    
    res.json({
      message: 'Build updated successfully',
      build: updatedBuild
    });
    
  } catch (error) {
    console.error('Error updating build:', error);
    res.status(500).json({ error: 'Failed to update build' });
  }
});

// Get all builds
app.get('/api/builds', async (req, res) => {
  try {
    const builds = await Build.find({}).sort({ createdDate: -1 }).lean();
    res.json(builds);
  } catch (error) {
    console.error('Error getting builds:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete a build
app.delete('/api/builds/:id', verifyAdminToken, async (req, res) => {
  try {
    const buildId = req.params.id;
    const deletedBuild = await Build.findOneAndDelete({ id: buildId }).lean();
    
    if (!deletedBuild) {
      return res.status(404).json({ error: 'Build not found' });
    }
    
    res.json({
      message: 'Build deleted successfully',
      deletedBuild
    });
    
  } catch (error) {
    console.error('Error deleting build:', error);
    res.status(500).json({ error: 'Failed to delete build' });
  }
});

// Admin file upload endpoint (for EditBuild component)
app.post('/api/admin/upload', verifyAdminToken, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    let captionsArray = [];
    const { captions } = req.body;
    if (captions) {
      try {
        captionsArray = Array.isArray(captions) ? captions : [captions];
      } catch (e) {
        console.log('Invalid captions format, using empty captions');
      }
    }

    const uploadedImages = req.files.map((file, index) => ({
      alt: file.originalname.replace(/\.[^/.]+$/, ""),
      caption: captionsArray[index] || '',
      url: getFileUrl(file)
    }));

    res.json({
      message: 'Files uploaded successfully',
      images: uploadedImages
    });

  } catch (error) {
    console.error('Admin upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// === SUBMISSION ENDPOINTS ===

// Submit a new build for review
app.post('/api/submissions', upload.array('images', 10), async (req, res) => {
  try {
    const { name, email, buildName, introText, header, imageCaptions, forSale, youtubeVideos, type, contactInfo, itemCategory, itemTitle, itemDescription } = req.body;
    
    const submissionType = type || 'build';
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    if (submissionType === 'build' && (!buildName || !name)) {
      return res.status(400).json({ error: 'Name and build name are required for build submissions' });
    }
    
    if (submissionType === 'for-sale-item' && !itemTitle) {
      return res.status(400).json({ error: 'Item title is required for for-sale submissions' });
    }
    
    let captions = [];
    if (imageCaptions) {
      try {
        captions = JSON.parse(imageCaptions);
      } catch (e) {
        console.log('Invalid caption format, using empty captions');
      }
    }
    
    let forSaleData = null;
    if (forSale) {
      try {
        forSaleData = JSON.parse(forSale);
      } catch (e) {
        console.log('Invalid forSale format, ignoring');
      }
    }
    
    let youtubeVideoData = [];
    if (youtubeVideos) {
      try {
        youtubeVideoData = JSON.parse(youtubeVideos);
      } catch (e) {
        console.log('Invalid youtubeVideos format, ignoring');
      }
    }
    
    const fileImages = req.files ? req.files.map((f, index) => ({
      alt: f.originalname.replace(/\.[^/.]+$/, ""),
      caption: captions[index] || '',
      url: getFileUrl(f)
    })) : [];
    
    const allImages = [...fileImages, ...youtubeVideoData];
    
    let contactInfoData = null;
    if (contactInfo) {
      try {
        contactInfoData = JSON.parse(contactInfo);
      } catch (e) {
        console.log('Invalid contactInfo format, ignoring');
      }
    }
    
    const newSubmission = {
      id: uuidv4(),
      type: submissionType,
      name: name || '',
      email,
      buildName: buildName || '',
      header: header || '',
      introText: introText || itemDescription || '',
      forSale: forSaleData,
      contactInfo: contactInfoData,
      itemCategory: itemCategory || null,
      itemTitle: itemTitle || null,
      status: 'pending',
      createdDate: new Date().toISOString(),
      images: allImages
    };
    
    await new Submission(newSubmission).save();

    sendSubmissionNotification(newSubmission);
    
    res.json({
      message: 'Submission received successfully',
      submission: {
        id: newSubmission.id,
        buildName: newSubmission.buildName,
        status: newSubmission.status
      }
    });
    
  } catch (error) {
    console.error('Submission creation error:', error);
    res.status(500).json({ error: 'Failed to process submission' });
  }
});

// Get all pending submissions (admin only)
app.get('/api/submissions', async (req, res) => {
  try {
    const pendingSubmissions = await Submission.find({ status: 'pending' }).sort({ createdDate: -1 }).lean();
    res.json(pendingSubmissions);
  } catch (error) {
    console.error('Error getting submissions:', error);
    res.status(500).json({ error: 'Failed to get submissions' });
  }
});

// Approve a submission (convert to build)
app.post('/api/submissions/:id/approve', verifyAdminToken, async (req, res) => {
  try {
    const submissionId = req.params.id;
    const submission = await Submission.findOne({ id: submissionId }).lean();
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    const newBuild = {
      id: uuidv4(),
      type: submission.type || 'build',
      name: submission.name,
      buildName: submission.buildName,
      header: submission.header,
      introText: submission.introText || '',
      forSale: submission.forSale,
      contactInfo: submission.contactInfo || null,
      itemCategory: submission.itemCategory || null,
      itemTitle: submission.itemTitle || null,
      images: submission.images || [],
      email: submission.email,
      createdDate: new Date().toISOString()
    };
    
    await new Build(newBuild).save();
    await Submission.findOneAndUpdate(
      { id: submissionId },
      { $set: { status: 'approved', approvedDate: new Date().toISOString() } }
    );
    
    res.json({
      message: 'Submission approved and converted to build',
      build: newBuild
    });
    
  } catch (error) {
    console.error('Error approving submission:', error);
    res.status(500).json({ error: 'Failed to approve submission' });
  }
});

// Update a submission
app.put('/api/submissions/:id', verifyAdminToken, async (req, res) => {
  try {
    const submissionId = req.params.id;
    const updatedData = req.body;
    
    const updatedSubmission = await Submission.findOneAndUpdate(
      { id: submissionId },
      { $set: { ...updatedData, updatedDate: new Date().toISOString() } },
      { new: true }
    ).lean();
    
    if (!updatedSubmission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.json({
      message: 'Submission updated successfully',
      submission: updatedSubmission
    });
    
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

// Reject a submission
app.post('/api/submissions/:id/reject', verifyAdminToken, async (req, res) => {
  try {
    const submissionId = req.params.id;
    const updated = await Submission.findOneAndUpdate(
      { id: submissionId },
      { $set: { status: 'rejected', rejectedDate: new Date().toISOString() } }
    ).lean();
    
    if (!updated) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.json({ message: 'Submission rejected' });
    
  } catch (error) {
    console.error('Error rejecting submission:', error);
    res.status(500).json({ error: 'Failed to reject submission' });
  }
});

// === INTERESTING CONTENT ENDPOINTS ===

// Get all interesting content
app.get('/api/interesting', async (req, res) => {
  try {
    const interesting = await Interesting.find({}).sort({ createdDate: -1 }).lean();
    res.json(interesting);
  } catch (error) {
    console.error('Error getting interesting content:', error);
    res.status(500).json({ error: 'Failed to get interesting content' });
  }
});

// Add new interesting content
app.post('/api/interesting', verifyAdminToken, upload.array('media', 20), async (req, res) => {
  try {
    const { header, description, metadata, youtubeVideos } = req.body;
    
    if (!header) {
      return res.status(400).json({ error: 'Header is required' });
    }
    
    let mediaMetadata = [];
    if (metadata) {
      try {
        mediaMetadata = JSON.parse(metadata);
      } catch (e) {
        console.log('Failed to parse media metadata:', e);
      }
    }
    
    let youtubeVideoData = [];
    if (youtubeVideos) {
      try {
        youtubeVideoData = JSON.parse(youtubeVideos);
      } catch (e) {
        console.log('Failed to parse YouTube videos:', e);
      }
    }
    
    const uploadedMedia = req.files ? req.files.map((file, index) => {
      const meta = mediaMetadata[index] || {};
      return {
        id: uuidv4(),
        type: file.mimetype.startsWith('image/') ? 'image' : 'video',
        alt: meta.alt || file.originalname.replace(/\.[^/.]+$/, ""),
        caption: meta.caption || '',
        url: getFileUrl(file)
      };
    }) : [];
    
    const youtubeMedia = youtubeVideoData.map(video => ({
      id: uuidv4(),
      type: 'youtube',
      alt: video.alt || 'YouTube video',
      caption: video.caption || '',
      url: video.url
    }));
    
    const allMedia = [...uploadedMedia, ...youtubeMedia];
    
    const newInteresting = {
      id: uuidv4(),
      header: header.trim(),
      description: description ? description.trim() : '',
      media: allMedia,
      createdDate: new Date().toISOString()
    };
    
    await new Interesting(newInteresting).save();
    
    res.json({
      message: 'Interesting content added successfully',
      interesting: newInteresting
    });
    
  } catch (error) {
    console.error('Error adding interesting content:', error);
    res.status(500).json({ error: 'Failed to add interesting content' });
  }
});

// Update interesting content
app.put('/api/interesting/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { header, description, media } = req.body;
    
    const updatedInteresting = await Interesting.findOneAndUpdate(
      { id },
      { $set: {
        ...(header && { header }),
        ...(description !== undefined && { description }),
        ...(media && { media }),
        updatedDate: new Date().toISOString()
      }},
      { new: true }
    ).lean();
    
    if (!updatedInteresting) {
      return res.status(404).json({ error: 'Interesting content not found' });
    }
    
    res.json({
      message: 'Interesting content updated successfully',
      interesting: updatedInteresting
    });
    
  } catch (error) {
    console.error('Error updating interesting content:', error);
    res.status(500).json({ error: 'Failed to update interesting content' });
  }
});

// Delete interesting content
app.delete('/api/interesting/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await Interesting.findOneAndDelete({ id }).lean();
    
    if (!deletedItem) {
      return res.status(404).json({ error: 'Interesting content not found' });
    }
    
    res.json({
      message: 'Interesting content deleted successfully',
      deletedItem
    });
    
  } catch (error) {
    console.error('Error deleting interesting content:', error);
    res.status(500).json({ error: 'Failed to delete interesting content' });
  }
});

// Catch-all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum file size is 99MB. For larger videos, consider uploading to YouTube and pasting the link instead.' });
    }
  }
  res.status(500).json({ error: error.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  console.log('Server shut down gracefully.');
  process.exit(0);
});