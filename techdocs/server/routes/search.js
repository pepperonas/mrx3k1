const express = require('express');
const router = express.Router();

// Controller-Funktionen importieren
const { searchDocuments } = require('../controllers/searchController');

// Routen definieren
router.get('/', searchDocuments);

module.exports = router;
