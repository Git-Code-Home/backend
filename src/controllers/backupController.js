import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import unzipper from 'unzipper';
import { exec } from 'child_process';
import util from 'util';
import { fileURLToPath } from 'url';

const execPromise = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Models
import User from '../models/User.js';
import Client from '../models/Client.js';
import Application from '../models/Application.js';
import ApplicationDetail from '../models/ApplicationDetail.js';
import ApplicationDocument from '../models/ApplicationDocument.js';
import Country from '../models/Country.js';
import FormTemplate from '../models/FormTemplate.js';
import Payment from '../models/Payment.js';
import PaymentReceipt from '../models/PaymentReceipt.js';
import Commission from '../models/Commission.js';
import AgentCommission from '../models/AgentCommission.js';
import Notification from '../models/Notification.js';
import RequiredDocumentApplication from '../models/RequiredDocumentApplication.js';

const BACKUP_DIR = path.join(__dirname, '../../backups');
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Create a full system backup
 */
export const createBackup = async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}`;
    const backupPath = path.join(BACKUP_DIR, `${backupName}.zip`);
    const tempDir = path.join(BACKUP_DIR, `temp-${timestamp}`);

    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    console.log('Starting backup process...');

    // 1. Export database collections to JSON
    const dbBackupDir = path.join(tempDir, 'database');
    fs.mkdirSync(dbBackupDir, { recursive: true });

    const collections = [
      { model: User, name: 'users' },
      { model: Client, name: 'clients' },
      { model: Application, name: 'applications' },
      { model: ApplicationDetail, name: 'applicationdetails' },
      { model: ApplicationDocument, name: 'applicationdocuments' },
      { model: Country, name: 'countries' },
      { model: FormTemplate, name: 'formtemplates' },
      { model: Payment, name: 'payments' },
      { model: PaymentReceipt, name: 'paymentreceipts' },
      { model: Commission, name: 'commissions' },
      { model: AgentCommission, name: 'agentcommissions' },
      { model: Notification, name: 'notifications' },
      { model: RequiredDocumentApplication, name: 'requireddocumentapplications' }
    ];

    console.log('Exporting database collections...');
    for (const { model, name } of collections) {
      try {
        const data = await model.find({}).lean();
        const filePath = path.join(dbBackupDir, `${name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Exported ${name}: ${data.length} records`);
      } catch (err) {
        console.error(`Error exporting ${name}:`, err.message);
      }
    }

    // 2. Copy uploads directory
    console.log('Copying uploaded files...');
    const uploadsBackupDir = path.join(tempDir, 'uploads');
    if (fs.existsSync(UPLOADS_DIR)) {
      await copyDirectory(UPLOADS_DIR, uploadsBackupDir);
    }

    // 3. Create metadata file
    const metadata = {
      backupName,
      timestamp: new Date().toISOString(),
      createdBy: req.user.name,
      collections: collections.map(c => c.name),
      version: '1.0'
    };
    fs.writeFileSync(
      path.join(tempDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    // 4. Create ZIP archive
    console.log('Creating ZIP archive...');
    await createZipArchive(tempDir, backupPath);

    // 5. Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });

    // Get backup file size
    const stats = fs.statSync(backupPath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);

    console.log('Backup completed successfully!');

    res.status(200).json({
      success: true,
      message: 'Backup created successfully',
      backup: {
        name: `${backupName}.zip`,
        path: backupPath,
        size: `${fileSizeInMB} MB`,
        sizeBytes: fileSizeInBytes,
        timestamp: metadata.timestamp
      }
    });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message
    });
  }
};

/**
 * List all available backups
 */
export const listBackups = async (req, res) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return res.status(200).json({
        success: true,
        backups: []
      });
    }

    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(file => file.endsWith('.zip'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
          sizeBytes: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.created - a.created);

    res.status(200).json({
      success: true,
      backups
    });
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list backups',
      error: error.message
    });
  }
};

/**
 * Download a specific backup file
 */
export const downloadBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename (security check)
    if (!filename || filename.includes('..') || !filename.endsWith('.zip')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid backup filename'
      });
    }

    const backupPath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found'
      });
    }

    res.download(backupPath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Failed to download backup'
          });
        }
      }
    });
  } catch (error) {
    console.error('Download backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download backup',
      error: error.message
    });
  }
};

/**
 * Delete a backup file
 */
export const deleteBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename (security check)
    if (!filename || filename.includes('..') || !filename.endsWith('.zip')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid backup filename'
      });
    }

    const backupPath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found'
      });
    }

    fs.unlinkSync(backupPath);

    res.status(200).json({
      success: true,
      message: 'Backup deleted successfully'
    });
  } catch (error) {
    console.error('Delete backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete backup',
      error: error.message
    });
  }
};

/**
 * Restore system from a backup file
 */
export const restoreBackup = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No backup file provided'
      });
    }

    const backupFile = req.file;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extractDir = path.join(BACKUP_DIR, `restore-${timestamp}`);

    console.log('Starting restore process...');
    console.log('Backup file:', backupFile.originalname);

    // Create extraction directory
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }

    // Extract ZIP file
    console.log('Extracting backup file...');
    await extractZipArchive(backupFile.path, extractDir);

    // Verify backup structure
    const metadataPath = path.join(extractDir, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      throw new Error('Invalid backup file: metadata.json not found');
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    console.log('Backup metadata:', metadata);

    // Restore database collections
    const dbBackupDir = path.join(extractDir, 'database');
    if (fs.existsSync(dbBackupDir)) {
      console.log('Restoring database collections...');
      
      const collections = [
        { model: User, name: 'users' },
        { model: Client, name: 'clients' },
        { model: Application, name: 'applications' },
        { model: ApplicationDetail, name: 'applicationdetails' },
        { model: ApplicationDocument, name: 'applicationdocuments' },
        { model: Country, name: 'countries' },
        { model: FormTemplate, name: 'formtemplates' },
        { model: Payment, name: 'payments' },
        { model: PaymentReceipt, name: 'paymentreceipts' },
        { model: Commission, name: 'commissions' },
        { model: AgentCommission, name: 'agentcommissions' },
        { model: Notification, name: 'notifications' },
        { model: RequiredDocumentApplication, name: 'requireddocumentapplications' }
      ];

      for (const { model, name } of collections) {
        const filePath = path.join(dbBackupDir, `${name}.json`);
        if (fs.existsSync(filePath)) {
          try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            // Clear existing data
            await model.deleteMany({});
            
            // Insert backup data
            if (data.length > 0) {
              await model.insertMany(data);
            }
            
            console.log(`Restored ${name}: ${data.length} records`);
          } catch (err) {
            console.error(`Error restoring ${name}:`, err.message);
          }
        }
      }
    }

    // Restore uploads directory
    const uploadsBackupDir = path.join(extractDir, 'uploads');
    if (fs.existsSync(uploadsBackupDir)) {
      console.log('Restoring uploaded files...');
      
      // Backup current uploads (optional safety measure)
      const currentUploadsBackup = path.join(BACKUP_DIR, `uploads-backup-${timestamp}`);
      if (fs.existsSync(UPLOADS_DIR)) {
        await copyDirectory(UPLOADS_DIR, currentUploadsBackup);
      }
      
      // Clear current uploads
      if (fs.existsSync(UPLOADS_DIR)) {
        fs.rmSync(UPLOADS_DIR, { recursive: true, force: true });
      }
      
      // Restore uploads
      await copyDirectory(uploadsBackupDir, UPLOADS_DIR);
    }

    // Clean up
    fs.rmSync(extractDir, { recursive: true, force: true });
    fs.unlinkSync(backupFile.path);

    console.log('Restore completed successfully!');

    res.status(200).json({
      success: true,
      message: 'System restored successfully',
      metadata
    });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore backup',
      error: error.message
    });
  }
};

// Helper function to create ZIP archive
function createZipArchive(sourceDir, outPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    output.on('close', () => {
      console.log(`Archive created: ${archive.pointer()} bytes`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// Helper function to extract ZIP archive
function extractZipArchive(zipPath, extractPath) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .on('close', resolve)
      .on('error', reject);
  });
}

// Helper function to copy directory recursively
async function copyDirectory(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
