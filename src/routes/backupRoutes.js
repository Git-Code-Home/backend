import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import * as backupController from '../controllers/backupController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for backup file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../backups/temp'));
  },
  filename: function (req, file, cb) {
    cb(null, `restore-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/zip' || 
        file.mimetype === 'application/x-zip-compressed' ||
        path.extname(file.originalname).toLowerCase() === '.zip') {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed'));
    }
  }
});

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Create a new backup
router.post('/create', backupController.createBackup);

// List all backups
router.get('/list', backupController.listBackups);

// Download a specific backup
router.get('/download/:filename', backupController.downloadBackup);

// Delete a specific backup
router.delete('/delete/:filename', backupController.deleteBackup);

// Restore from backup
router.post('/restore', upload.single('backupFile'), backupController.restoreBackup);

export default router;
