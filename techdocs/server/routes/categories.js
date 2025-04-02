const express = require('express');
const router = express.Router();

// Controller-Funktionen importieren
const {
  getAllCategories,
  getCategory,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

// Authentifizierungs-Middleware importieren
const { protect, authorize } = require('../middleware/auth');

// Routen definieren
router
  .route('/')
  .get(getAllCategories)
  .post(protect, authorize('admin'), createCategory);

router
  .route('/:id')
  .get(getCategory)
  .put(protect, authorize('admin'), updateCategory)
  .delete(protect, authorize('admin'), deleteCategory);

router.get('/slug/:slug', getCategoryBySlug);

module.exports = router;
