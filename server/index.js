// filepath: /server/index.js
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configure dotenv
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

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

// Upload photos
app.post('/api/photos/upload', upload.array('photos', 10), (req, res) => {
  try {
    const { category } = req.body;
    
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    // Read existing photos
    const photos = readPhotos();
    
    // Add new photos
    const uploadedFiles = req.files.map(file => {
      const newPhoto = {
        id: uuidv4(),
        filename: file.filename,
        originalName: file.originalname,
        category: category,
        caption: '',
        uploadDate: new Date().toISOString(),
        url: `/ugli-boats-v2/uploads/${file.filename}`
      };
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

// Add a new build
app.post('/api/builds', upload.array('images', 20), (req, res) => {
  try {
    const { name, buildName, header, introText, email } = req.body;

    if (!buildName) {
      return res.status(400).json({ error: 'Build name is required' });
    }
    
    // Read existing builds
    const builds = readBuilds();
    
    // Create new build (matching data.tsx structure)
    const newBuild = {
      id: uuidv4(),
      name,
      buildName,
      header: header || "",
      introText: introText || '',
      email,
      images: req.files ? req.files.map(f => ({
        alt: f.originalname.replace(/\.[^/.]+$/, ""), // Remove file extension for alt text
        caption: '',
        url: `/uploads/${f.filename}` // Use consistent format for local development
      })) : [],
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
app.put('/api/builds/:id', (req, res) => {
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
app.delete('/api/builds/:id', (req, res) => {
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
app.post('/api/admin/upload', upload.array('images', 10), (req, res) => {
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
    const { name, email, buildName, introText, imageCaptions } = req.body;
    
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
    
    // Create new submission with proper image format
    const newSubmission = {
      id: uuidv4(),
      name,
      email,
      buildName,
      introText: introText || '',
      status: 'pending',
      createdDate: new Date().toISOString(),
      images: req.files ? req.files.map((f, index) => ({
        alt: f.originalname.replace(/\.[^/.]+$/, ""),
        caption: captions[index] || '',
        url: `/uploads/${f.filename}` // Use consistent format for local development
      })) : []
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
app.post('/api/submissions/:id/approve', (req, res) => {
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
app.put('/api/submissions/:id', (req, res) => {
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
app.post('/api/submissions/:id/reject', (req, res) => {
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