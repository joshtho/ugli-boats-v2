// filepath: /server/index.js
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

// Configure dotenv
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Store the current valid session token (in-memory for single admin)
let currentValidToken = null;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded files
app.use('/ugli-boats-v2/uploads', express.static('uploads')); // Serve uploaded files for GitHub Pages
app.use('/ugli-boats-v2/IMAGES', express.static(path.join(__dirname, '../public/IMAGES'))); // Serve legacy images for GitHub Pages

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create data directory and files for JSON storage
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const photosFile = path.join(dataDir, 'photos.json');
const buildsFile = path.join(dataDir, 'builds.json');
const submissionsFile = path.join(dataDir, 'submissions.json');
const interestingFile = path.join(dataDir, 'interesting.json');

// Initialize JSON files if they don't exist
if (!fs.existsSync(photosFile)) {
  fs.writeFileSync(photosFile, JSON.stringify([], null, 2));
}
if (!fs.existsSync(buildsFile)) {
  fs.writeFileSync(buildsFile, JSON.stringify([], null, 2));
}
if (!fs.existsSync(submissionsFile)) {
  fs.writeFileSync(submissionsFile, JSON.stringify([], null, 2));
}
if (!fs.existsSync(interestingFile)) {
  fs.writeFileSync(interestingFile, JSON.stringify([], null, 2));
}

// Helper functions for JSON file operations
const readPhotos = () => {
  try {
    const data = fs.readFileSync(photosFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading photos:', error);
    return [];
  }
};

const writePhotos = (photos) => {
  try {
    fs.writeFileSync(photosFile, JSON.stringify(photos, null, 2));
  } catch (error) {
    console.error('Error writing photos:', error);
  }
};

const readBuilds = () => {
  try {
    const data = fs.readFileSync(buildsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading builds:', error);
    return [];
  }
};

const writeBuilds = (builds) => {
  try {
    fs.writeFileSync(buildsFile, JSON.stringify(builds, null, 2));
  } catch (error) {
    console.error('Error writing builds:', error);
  }
};

const readSubmissions = () => {
  try {
    const data = fs.readFileSync(submissionsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading submissions:', error);
    return [];
  }
};

const writeSubmissions = (submissions) => {
  try {
    fs.writeFileSync(submissionsFile, JSON.stringify(submissions, null, 2));
  } catch (error) {
    console.error('Error writing submissions:', error);
  }
};

const readInteresting = () => {
  try {
    const data = fs.readFileSync(interestingFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading interesting content:', error);
    return [];
  }
};

const writeInteresting = (interesting) => {
  try {
    fs.writeFileSync(interestingFile, JSON.stringify(interesting, null, 2));
  } catch (error) {
    console.error('Error writing interesting content:', error);
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

// Initialize JSON storage
console.log('Using JSON file storage for data persistence');

// Routes

// Basic health check
app.get('/', (req, res) => {
  res.json({ message: 'UGLI Boats API Server is running!' });
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
        console.log('Login attempt blocked - admin already logged in');
        return res.status(423).json({ 
          error: 'Admin already logged in. Please try again later or contact the current admin to logout.',
          code: 'ADMIN_ALREADY_ACTIVE'
        });
      } catch (tokenError) {
        // Existing token is expired/invalid, allow new login
        console.log('Existing token expired, allowing new login');
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
    console.log('New admin session created');
    console.log('Current valid token stored:', currentValidToken?.substring(0, 20) + '...');
    
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

    // Debug info
    const debugInfo = {
      receivedTokenLength: token.length,
      receivedTokenPreview: token.substring(0, 50) + '...',
      storedTokenLength: currentValidToken?.length || 0,
      storedTokenPreview: currentValidToken?.substring(0, 50) + '...' || 'No token',
      tokensMatch: token === currentValidToken,
      hasCurrentToken: currentValidToken !== null
    };
    
    console.log('DEBUG Verify:', JSON.stringify(debugInfo, null, 2));

    // Check if this is the current valid token (single session security)
    if (currentValidToken !== null && token !== currentValidToken) {
      console.log('Token mismatch - session invalid');
      return res.status(401).json({ 
        error: 'Session expired or invalid.',
        debug: debugInfo
      });
    }
    
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const decoded = jwt.verify(token, jwtSecret);
    
    if (!decoded.admin) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    console.log('Token verification successful');
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
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    // For single-admin system, clear session regardless of token match
    // This allows recovery if tokens get out of sync
    if (currentValidToken !== null) {
      currentValidToken = null;
      console.log('Admin session cleared via logout - new logins now allowed');
    } else {
      console.log('Logout called but no active session found');
    }
    
    res.json({ message: 'Logout successful' });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Debug endpoint to check current token status
app.get('/api/auth/debug', (req, res) => {
  res.json({
    hasCurrentToken: currentValidToken !== null,
    tokenLength: currentValidToken?.length || 0,
    tokenPreview: currentValidToken?.substring(0, 50) + '...' || 'No token'
  });
});

// Middleware to verify admin token for protected routes
const verifyAdminToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Check if this is the current valid token (single session security)
    console.log('Middleware - Checking token:', token?.substring(0, 20) + '...');
    console.log('Middleware - Current valid token:', currentValidToken?.substring(0, 20) + '...');
    
    if (currentValidToken !== null && token !== currentValidToken) {
      console.log('Middleware - Token mismatch, access denied');
      return res.status(401).json({ error: 'Access denied. Session expired or invalid.' });
    }
    
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const decoded = jwt.verify(token, jwtSecret);
    
    if (!decoded.admin) {
      return res.status(401).json({ error: 'Access denied. Invalid token.' });
    }
    
    req.admin = decoded;
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access denied. Token expired.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Access denied. Invalid token.' });
    }
    
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Access denied. Token verification failed.' });
  }
};

// Upload photos
app.post('/api/photos/upload', verifyAdminToken, upload.array('photos', 10), (req, res) => {
  try {
    const { category, metadata } = req.body;
    
    // Debug logging
    console.log('Upload request received:');
    console.log('Category:', category);
    console.log('Metadata:', metadata);
    console.log('Files count:', req.files ? req.files.length : 0);
    console.log('All body keys:', Object.keys(req.body));
    
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
    
    // Read existing photos
    const photos = readPhotos();
    
    // Add new photos
    const uploadedFiles = req.files.map((file, index) => {
      const newPhoto = {
        id: uuidv4(),
        image: `/ugli-boats-v2/uploads/${file.filename}`,
        alt: alts[index] || `${category} - ${file.originalname}`,
        category: category,
        caption: captions[index] || '',
        uploadDate: new Date().toISOString()
      };
      console.log(`Photo ${index}:`, newPhoto);
      photos.push(newPhoto);
      return newPhoto;
    });
    
    // Save updated photos
    writePhotos(photos);
    
    res.json({
      message: `Successfully uploaded ${uploadedFiles.length} photos`,
      files: uploadedFiles
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get all photos by category
app.get('/api/photos/:category', (req, res) => {
  try {
    const { category } = req.params;
    const photos = readPhotos();
    
    const filteredPhotos = photos
      .filter(photo => photo.category === category)
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    
    res.json(filteredPhotos);
  } catch (error) {
    console.error('Error getting photos:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all photos
app.get('/api/photos', (req, res) => {
  try {
    const photos = readPhotos();
    const sortedPhotos = photos.sort((a, b) => {
      // Sort by category first, then by upload date
      if (a.category === b.category) {
        return new Date(b.uploadDate) - new Date(a.uploadDate);
      }
      return a.category.localeCompare(b.category);
    });
    
    res.json(sortedPhotos);
  } catch (error) {
    console.error('Error getting photos:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete a photo
app.delete('/api/photos/:id', verifyAdminToken, (req, res) => {
  try {
    const { id } = req.params;
    console.log('Delete request for photo ID:', id);
    
    const photos = readPhotos();
    const photoIndex = photos.findIndex(photo => photo.id === id);
    
    if (photoIndex === -1) {
      console.log('Photo not found with ID:', id);
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Get the photo to delete for cleanup
    const photoToDelete = photos[photoIndex];
    console.log('Found photo to delete:', photoToDelete.image);
    
    // Remove photo from array
    const deletedPhoto = photos.splice(photoIndex, 1)[0];
    console.log('Deleted photo:', deletedPhoto.alt);
    
    // Save updated photos array
    writePhotos(photos);
    
    // Optional: Delete the actual file from disk for uploaded photos
    if (photoToDelete.image.includes('/uploads/')) {
      const filename = photoToDelete.image.split('/').pop();
      const filePath = path.join(__dirname, 'uploads', filename);
      
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log('Could not delete file from disk:', err.message);
          // Don't fail the request if file deletion fails
        } else {
          console.log('Successfully deleted file from disk:', filename);
        }
      });
    }
    
    res.json({
      message: 'Photo deleted successfully',
      deletedPhoto: deletedPhoto
    });
    
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Update a photo
app.put('/api/photos/:id', verifyAdminToken, (req, res) => {
  try {
    const { id } = req.params;
    const { alt, caption, category } = req.body;
    
    console.log('Update request for photo ID:', id);
    console.log('Update data:', { alt, caption, category });
    
    const photos = readPhotos();
    const photoIndex = photos.findIndex(photo => photo.id === id);
    
    if (photoIndex === -1) {
      console.log('Photo not found with ID:', id);
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Update the photo
    const updatedPhoto = {
      ...photos[photoIndex],
      alt: alt || photos[photoIndex].alt,
      caption: caption !== undefined ? caption : photos[photoIndex].caption,
      category: category || photos[photoIndex].category
    };
    
    photos[photoIndex] = updatedPhoto;
    console.log('Updated photo:', updatedPhoto);
    
    // Save updated photos array
    writePhotos(photos);
    
    res.json({
      message: 'Photo updated successfully',
      updatedPhoto: updatedPhoto
    });
    
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(500).json({ error: 'Failed to update photo' });
  }
});

// Add a new build
app.post('/api/builds', upload.array('images', 20), (req, res) => {
  try {
    const { name, buildName, header, introText, email, forSale, images } = req.body;

    if (!buildName) {
      return res.status(400).json({ error: 'Build name is required' });
    }
    
    // Read existing builds
    const builds = readBuilds();
    
    // Parse forSale data if provided
    let forSaleData = null;
    if (forSale) {
      try {
        // Handle both string (from FormData) and object (from JSON) cases
        forSaleData = typeof forSale === 'string' ? JSON.parse(forSale) : forSale;
      } catch (e) {
        console.log('Invalid forSale format, ignoring');
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
      images: req.files ? req.files.map(f => ({
        alt: f.originalname.replace(/\.[^/.]+$/, ""), // Remove file extension for alt text
        caption: '',
        url: `/uploads/${f.filename}` // Use consistent format for local development
      })) : (images || []), // Use images from JSON body if no files uploaded
      createdDate: new Date().toISOString()
    };
    
    // Add to builds array
    builds.push(newBuild);
    
    // Save updated builds
    writeBuilds(builds);
    
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
app.put('/api/builds/:id', verifyAdminToken, (req, res) => {
  try {
    const buildId = req.params.id;
    const updatedData = req.body;
    
    console.log('PUT /api/builds/:id called');
    console.log('Build ID:', buildId);
    console.log('Updated data:', JSON.stringify(updatedData, null, 2));
    
    // Read builds
    const builds = readBuilds();
    console.log('Found builds count:', builds.length);
    
    const buildIndex = builds.findIndex(b => b.id === buildId);
    console.log('Build index:', buildIndex);
    
    if (buildIndex === -1) {
      console.log('Build not found');
      return res.status(404).json({ error: 'Build not found' });
    }
    
    // Update build with new data
    builds[buildIndex] = {
      ...builds[buildIndex],
      ...updatedData,
      updatedDate: new Date().toISOString()
    };
    
    console.log('Updated build:', JSON.stringify(builds[buildIndex], null, 2));
    
    writeBuilds(builds);
    console.log('Build updated successfully');
    
    res.json({
      message: 'Build updated successfully',
      build: builds[buildIndex]
    });
    
  } catch (error) {
    console.error('Error updating build:', error);
    res.status(500).json({ error: 'Failed to update build' });
  }
});

// Get all builds
app.get('/api/builds', (req, res) => {
  try {
    const builds = readBuilds();
    const sortedBuilds = builds.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    
    res.json(sortedBuilds);
  } catch (error) {
    console.error('Error getting builds:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete a build
app.delete('/api/builds/:id', verifyAdminToken, (req, res) => {
  try {
    const buildId = req.params.id;
    console.log('Delete request for build ID:', buildId);
    
    // Read existing builds
    const builds = readBuilds();
    console.log('Total builds:', builds.length);
    console.log('Build IDs:', builds.map(b => b.id));
    
    // Find the build index
    const buildIndex = builds.findIndex(build => build.id === buildId);
    console.log('Found build at index:', buildIndex);
    
    if (buildIndex === -1) {
      console.log('Build not found with ID:', buildId);
      return res.status(404).json({ error: 'Build not found' });
    }
    
    // Remove the build from the array
    const deletedBuild = builds.splice(buildIndex, 1)[0];
    console.log('Deleted build:', deletedBuild.buildName);
    
    // Save updated builds
    writeBuilds(builds);
    
    res.json({
      message: 'Build deleted successfully',
      deletedBuild: deletedBuild
    });
    
  } catch (error) {
    console.error('Error deleting build:', error);
    res.status(500).json({ error: 'Failed to delete build' });
  }
});

// Admin file upload endpoint (for EditBuild component)
app.post('/api/admin/upload', verifyAdminToken, upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedImages = req.files.map(file => ({
      alt: file.originalname.replace(/\.[^/.]+$/, ""),
      caption: '',
      url: `/uploads/${file.filename}`
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
app.post('/api/submissions', upload.array('images', 10), (req, res) => {
  try {
    const { name, email, buildName, introText, header, imageCaptions, forSale, youtubeVideos } = req.body;
    
    if (!name || !email || !buildName) {
      return res.status(400).json({ error: 'Name, email, and build name are required' });
    }
    
    // Read existing submissions
    const submissions = readSubmissions();
    
    // Parse captions if provided (should be JSON array)
    let captions = [];
    if (imageCaptions) {
      try {
        captions = JSON.parse(imageCaptions);
      } catch (e) {
        console.log('Invalid caption format, using empty captions');
      }
    }
    
    // Parse forSale data if provided
    let forSaleData = null;
    if (forSale) {
      try {
        forSaleData = JSON.parse(forSale);
      } catch (e) {
        console.log('Invalid forSale format, ignoring');
      }
    }
    
    // Parse YouTube videos if provided
    let youtubeVideoData = [];
    if (youtubeVideos) {
      try {
        youtubeVideoData = JSON.parse(youtubeVideos);
      } catch (e) {
        console.log('Invalid youtubeVideos format, ignoring');
      }
    }
    
    // Create images array from uploaded files
    const fileImages = req.files ? req.files.map((f, index) => ({
      alt: f.originalname.replace(/\.[^/.]+$/, ""),
      caption: captions[index] || '',
      url: `/uploads/${f.filename}` // Use consistent format for local development
    })) : [];
    
    // Combine file images with YouTube videos
    const allImages = [...fileImages, ...youtubeVideoData];
    
    // Create new submission with proper image format
    const newSubmission = {
      id: uuidv4(),
      name,
      email,
      buildName,
      header: header || '',
      introText: introText || '',
      forSale: forSaleData,
      status: 'pending',
      createdDate: new Date().toISOString(),
      images: allImages
    };
    
    // Add to submissions array
    submissions.push(newSubmission);
    
    // Save updated submissions
    writeSubmissions(submissions);
    
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
app.get('/api/submissions', (req, res) => {
  try {
    const submissions = readSubmissions();
    const pendingSubmissions = submissions
      .filter(s => s.status === 'pending')
      .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    
    res.json(pendingSubmissions);
  } catch (error) {
    console.error('Error getting submissions:', error);
    res.status(500).json({ error: 'Failed to get submissions' });
  }
});

// Approve a submission (convert to build)
app.post('/api/submissions/:id/approve', verifyAdminToken, (req, res) => {
  try {
    const submissionId = req.params.id;
    
    // Read submissions
    const submissions = readSubmissions();
    const submissionIndex = submissions.findIndex(s => s.id === submissionId);
    
    if (submissionIndex === -1) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    const submission = submissions[submissionIndex];
    
    // Create build from submission (matching data.tsx structure)
    const builds = readBuilds();
    const newBuild = {
      id: uuidv4(),
      name: submission.name,
      buildName: submission.buildName,
      header: submission.header,
      introText: submission.introText || '',
      forSale: submission.forSale, // Include forSale data from submission
      images: submission.images || [], // Already in correct format
      email: submission.email,
      createdDate: new Date().toISOString()
    };
    
    builds.push(newBuild);
    writeBuilds(builds);
    
    // Update submission status
    submissions[submissionIndex].status = 'approved';
    submissions[submissionIndex].approvedDate = new Date().toISOString();
    writeSubmissions(submissions);
    
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
app.put('/api/submissions/:id', verifyAdminToken, (req, res) => {
  try {
    const submissionId = req.params.id;
    const updatedData = req.body;
    
    console.log('PUT /api/submissions/:id called');
    console.log('Submission ID:', submissionId);
    console.log('Updated data:', JSON.stringify(updatedData, null, 2));
    
    // Read submissions
    const submissions = readSubmissions();
    console.log('Found submissions count:', submissions.length);
    
    const submissionIndex = submissions.findIndex(s => s.id === submissionId);
    console.log('Submission index:', submissionIndex);
    
    if (submissionIndex === -1) {
      console.log('Submission not found');
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Update submission with new data
    submissions[submissionIndex] = {
      ...submissions[submissionIndex],
      ...updatedData,
      updatedDate: new Date().toISOString()
    };
    
    console.log('Updated submission:', JSON.stringify(submissions[submissionIndex], null, 2));
    
    writeSubmissions(submissions);
    console.log('Submission updated successfully');
    
    res.json({
      message: 'Submission updated successfully',
      submission: submissions[submissionIndex]
    });
    
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

// Reject a submission
app.post('/api/submissions/:id/reject', verifyAdminToken, (req, res) => {
  try {
    const submissionId = req.params.id;
    
    // Read submissions
    const submissions = readSubmissions();
    const submissionIndex = submissions.findIndex(s => s.id === submissionId);
    
    if (submissionIndex === -1) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Update submission status
    submissions[submissionIndex].status = 'rejected';
    submissions[submissionIndex].rejectedDate = new Date().toISOString();
    writeSubmissions(submissions);
    
    res.json({
      message: 'Submission rejected'
    });
    
  } catch (error) {
    console.error('Error rejecting submission:', error);
    res.status(500).json({ error: 'Failed to reject submission' });
  }
});

// === INTERESTING CONTENT ENDPOINTS ===

// Get all interesting content
app.get('/api/interesting', (req, res) => {
  try {
    const interesting = readInteresting();
    const sortedInteresting = interesting.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    
    res.json(sortedInteresting);
  } catch (error) {
    console.error('Error getting interesting content:', error);
    res.status(500).json({ error: 'Failed to get interesting content' });
  }
});

// Add new interesting content
app.post('/api/interesting', verifyAdminToken, upload.array('media', 20), (req, res) => {
  try {
    const { header, description, metadata, youtubeVideos } = req.body;
    
    console.log('Interesting content upload request:');
    console.log('Header:', header);
    console.log('Description:', description);
    console.log('Metadata:', metadata);
    console.log('YouTube videos:', youtubeVideos);
    console.log('Files count:', req.files ? req.files.length : 0);
    
    if (!header) {
      return res.status(400).json({ error: 'Header is required' });
    }
    
    // Read existing interesting content
    const interesting = readInteresting();
    
    // Parse metadata for media files
    let mediaMetadata = [];
    if (metadata) {
      try {
        mediaMetadata = JSON.parse(metadata);
      } catch (e) {
        console.log('Failed to parse media metadata:', e);
      }
    }
    
    // Parse YouTube videos
    let youtubeVideoData = [];
    if (youtubeVideos) {
      try {
        youtubeVideoData = JSON.parse(youtubeVideos);
      } catch (e) {
        console.log('Failed to parse YouTube videos:', e);
      }
    }
    
    // Process uploaded media files
    const uploadedMedia = req.files ? req.files.map((file, index) => {
      const metadata = mediaMetadata[index] || {};
      return {
        id: uuidv4(),
        type: file.mimetype.startsWith('image/') ? 'image' : 'video',
        alt: metadata.alt || file.originalname.replace(/\.[^/.]+$/, ""),
        caption: metadata.caption || '',
        url: `/ugli-boats-v2/uploads/${file.filename}`
      };
    }) : [];
    
    // Process YouTube videos
    const youtubeMedia = youtubeVideoData.map(video => ({
      id: uuidv4(),
      type: 'youtube',
      alt: video.alt || 'YouTube video',
      caption: video.caption || '',
      url: video.url
    }));
    
    // Combine all media
    const allMedia = [...uploadedMedia, ...youtubeMedia];
    
    // Create new interesting content item
    const newInteresting = {
      id: uuidv4(),
      header: header.trim(),
      description: description ? description.trim() : '',
      media: allMedia,
      createdDate: new Date().toISOString()
    };
    
    // Add to interesting content array
    interesting.push(newInteresting);
    
    // Save updated interesting content
    writeInteresting(interesting);
    
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
app.put('/api/interesting/:id', verifyAdminToken, (req, res) => {
  try {
    const { id } = req.params;
    const { header, description, media } = req.body;
    
    console.log('Update interesting content request for ID:', id);
    console.log('Update data:', { header, description, media: media?.length });
    
    const interesting = readInteresting();
    const interestingIndex = interesting.findIndex(item => item.id === id);
    
    if (interestingIndex === -1) {
      return res.status(404).json({ error: 'Interesting content not found' });
    }
    
    // Update the interesting content
    const updatedInteresting = {
      ...interesting[interestingIndex],
      header: header || interesting[interestingIndex].header,
      description: description !== undefined ? description : interesting[interestingIndex].description,
      media: media || interesting[interestingIndex].media,
      updatedDate: new Date().toISOString()
    };
    
    interesting[interestingIndex] = updatedInteresting;
    
    // Save updated interesting content
    writeInteresting(interesting);
    
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
app.delete('/api/interesting/:id', verifyAdminToken, (req, res) => {
  try {
    const { id } = req.params;
    console.log('Delete interesting content request for ID:', id);
    
    const interesting = readInteresting();
    const interestingIndex = interesting.findIndex(item => item.id === id);
    
    if (interestingIndex === -1) {
      return res.status(404).json({ error: 'Interesting content not found' });
    }
    
    // Get the item to delete for cleanup
    const itemToDelete = interesting[interestingIndex];
    
    // Remove item from array
    const deletedItem = interesting.splice(interestingIndex, 1)[0];
    
    // Save updated interesting content
    writeInteresting(interesting);
    
    // Optional: Delete uploaded media files from disk
    if (itemToDelete.media) {
      itemToDelete.media.forEach(mediaItem => {
        if (mediaItem.url.includes('/uploads/')) {
          const filename = mediaItem.url.split('/').pop();
          const filePath = path.join(__dirname, 'uploads', filename);
          
          fs.unlink(filePath, (err) => {
            if (err) {
              console.log('Could not delete media file from disk:', err.message);
            } else {
              console.log('Successfully deleted media file from disk:', filename);
            }
          });
        }
      });
    }
    
    res.json({
      message: 'Interesting content deleted successfully',
      deletedItem: deletedItem
    });
    
  } catch (error) {
    console.error('Error deleting interesting content:', error);
    res.status(500).json({ error: 'Failed to delete interesting content' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
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