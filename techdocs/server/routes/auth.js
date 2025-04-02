const express = require('express');
const router = express.Router();

// Controller-Funktionen importieren
const {
  register,
  login,
  getMe,
  logout
} = require('../controllers/authController');

// Authentifizierungs-Middleware importieren
const { protect } = require('../middleware/auth');

// Routen definieren
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', logout);

module.exports = router;
