const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Fallback Local Storage Setup
const localUploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
}

const localStore = multer.diskStorage({
    destination: (req, file, cb) => cb(null, localUploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'greeting-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Cloudinary Storage Setup
const cloudStore = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'harmony-greetings',
    resource_type: 'auto', // Important for GIF support
    allowed_formats: ['jpg', 'png', 'gif', 'jpeg']
  },
});

// Determine which storage to use
const isCloudEnabled = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY;
const upload = multer({ 
    storage: isCloudEnabled ? cloudStore : localStore,
    limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/greeting', authenticate, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        // Cloudinary returns 'path' or 'secure_url', Multer Local returns 'filename'
        const fileUrl = isCloudEnabled ? req.file.path : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        
        console.log(`[Upload] Successful ${isCloudEnabled ? 'Cloud' : 'Local'} storage: ${fileUrl}`);
        res.json({ success: true, url: fileUrl });
    } catch (error) {
        console.error('[Upload Error]', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
