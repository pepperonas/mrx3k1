const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Schütze Routen
exports.protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Token aus dem Header extrahieren
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    // Token aus dem Cookie extrahieren
    token = req.cookies.token;
  }
  
  // Prüfen, ob Token existiert
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Kein Zugriff auf diese Route'
    });
  }
  
  try {
    // Token verifizieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'techdocs_jwt_secret');
    
    req.user = await User.findById(decoded.id);
    
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Kein Zugriff auf diese Route'
    });
  }
};

// Rollen-Autorisierung
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Die Rolle ${req.user.role} ist nicht berechtigt, auf diese Route zuzugreifen`
      });
    }
    next();
  };
};
