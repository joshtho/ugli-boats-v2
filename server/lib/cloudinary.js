import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars now — this module is imported before dotenv.config() runs in index.js
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const hasCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

// Custom multer storage engine for Cloudinary v2 (no multer-storage-cloudinary needed)
class CloudinaryStorageEngine {
  _handleFile(req, file, cb) {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'ugli-boats', resource_type: 'auto' },
      (error, result) => {
        if (error) return cb(error);
        cb(null, {
          path: result.secure_url,
          filename: result.public_id,
          size: result.bytes,
        });
      }
    );
    file.stream.pipe(uploadStream);
  }

  _removeFile(req, file, cb) {
    cloudinary.uploader.destroy(file.filename, cb);
  }
}

let storage;

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorageEngine();

  console.log('Using Cloudinary storage');
} else {
  // Fallback to local disk storage for development (no Cloudinary keys needed)
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`),
  });

  console.log('Using local disk storage (set CLOUDINARY_* env vars to enable Cloudinary)');
}

// Returns the public URL for a multer file object.
// Cloudinary: file.path is the full https:// URL.
// Disk fallback: build a local /uploads/ URL from file.filename.
const getFileUrl = (file) => {
  if (hasCloudinary) {
    return file.path;
  }
  return `/uploads/${file.filename}`;
};

export { cloudinary, storage, hasCloudinary, getFileUrl };
