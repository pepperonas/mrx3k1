const User = require('../models/User');

// Benutzer registrieren
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Benutzer erstellen
    const user = await User.create({
      name,
      email,
      password,
      role
    });
    
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Benutzer anmelden
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Bitte E-Mail und Passwort angeben'
      });
    }
    
    // Benutzer suchen
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Ungültige Anmeldeinformationen'
      });
    }
    
    // Passwort überprüfen
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Ungültige Anmeldeinformationen'
      });
    }
    
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Token mit Cookie senden
const sendTokenResponse = (user, statusCode, res) => {
  // Token erstellen
  const token = user.getSignedJwtToken();
  
  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000 || 30 * 24 * 60 * 60 * 1000),
    httpOnly: true
  };
  
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }
  
  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};

// Aktuellen Benutzer abrufen
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Abmelden / Cookie löschen
exports.logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    success: true,
    data: {}
  });
};
