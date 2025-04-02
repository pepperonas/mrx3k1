const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Controller-Funktionen importieren
const {
  getAllDocuments,
  getDocument,
  getDocumentBySlug,
  createDocument,
  updateDocument,
  deleteDocument,
  importMarkdownFile
} = require('../controllers/documentationController');

// Authentifizierungs-Middleware importieren
const { protect, authorize } = require('../middleware/auth');

// Multer-Konfiguration für Datei-Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    // Nur Markdown-Dateien akzeptieren
    if (path.extname(file.originalname).toLowerCase() === '.md') {
      return cb(null, true);
    }
    
    cb(new Error('Nur Markdown-Dateien (.md) sind erlaubt'));
  }
});

// Routen definieren
router
  .route('/')
  .get(getAllDocuments)
  .post(protect, authorize('admin'), createDocument);

router
  .route('/:id')
  .get(getDocument)
  .put(protect, authorize('admin'), updateDocument)
  .delete(protect, authorize('admin'), deleteDocument);

router.get('/slug/:slug', getDocumentBySlug);

router.post(
  '/import',
  protect,
  authorize('admin'),
  upload.single('file'),
  importMarkdownFile
);

module.exports = router;
