// server.js - Hauptdatei für den Marketplace-Server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// Konfiguration
const config = {
  port: process.env.PORT || 5005,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27018/securemarket',
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
  saltRounds: 12,
  sslKey: process.env.SSL_KEY || path.join(__dirname, 'certs', 'key.pem'),
  sslCert: process.env.SSL_CERT || path.join(__dirname, 'certs', 'cert.pem')
};

// Express-App initialisieren
const app = express();

// Middleware für Sicherheit
app.use(helmet()); // Setzt verschiedene HTTP-Header für Sicherheit
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate Limiting gegen Brute-Force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 5, // 5 Anfragen pro IP
  message: { error: 'Zu viele Login-Versuche, bitte versuchen Sie es später wieder.' }
});

// Health-Check Endpunkt
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// MongoDB-Schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  pgpPublicKey: String,
  role: { type: String, enum: ['user', 'vendor', 'admin'], default: 'user' },
  twoFactorSecret: String,
  isTwoFactorEnabled: { type: Boolean, default: false }
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: String,
  tags: [String],
  images: [String],
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  encryptedDetails: String // PGP verschlüsselte Details
});

const OrderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1 }
  }],
  totalPrice: Number,
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'completed', 'disputed', 'cancelled'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  shippingInfo: String, // PGP verschlüsselt
  paymentMethod: String,
  transactionId: String
});

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  encryptedContent: { type: String, required: true }, // PGP verschlüsselt
  createdAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
});

// Modelle erstellen
const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);
const Order = mongoose.model('Order', OrderSchema);
const Message = mongoose.model('Message', MessageSchema);

// Hilfsfunktion für Token-Erstellung
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: '1h' });
};

// Middleware für Authentifizierung
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Kein Authentifizierungstoken' });

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) return res.status(401).json({ error: 'Ungültiger Token' });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }
};

// API-Routen

// Registrierung
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email, pgpPublicKey } = req.body;

    // Validierung
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Alle Felder müssen ausgefüllt sein' });
    }

    // Prüfen, ob Benutzer bereits existiert
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Benutzername oder E-Mail existiert bereits' });
    }

    // Passwort hashen
    const passwordHash = await bcrypt.hash(password, config.saltRounds);

    // Benutzer erstellen
    const user = new User({
      username,
      passwordHash,
      email,
      pgpPublicKey
    });

    await user.save();

    // Token generieren
    const token = generateToken(user._id);

    res.status(201).json({ token, user: { id: user._id, username, email } });
  } catch (error) {
    res.status(500).json({ error: 'Serverfehler bei der Registrierung' });
  }
});

// Login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { username, password, twoFactorCode } = req.body;

    // Benutzer finden
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Ungültige Anmeldeinformationen' });
    }

    // Passwort überprüfen
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Ungültige Anmeldeinformationen' });
    }

    // 2FA prüfen falls aktiviert
    if (user.isTwoFactorEnabled) {
      // Wenn kein 2FA-Code gesendet wurde, fordern wir ihn an
      if (!twoFactorCode) {
        return res.status(200).json({ requiresTwoFactor: true, userId: user._id });
      }

      // TOTP-Code verifizieren
      const speakeasy = require('speakeasy');
      const isValidToken = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 1 // Erlaubt eine kleine Zeitabweichung
      });

      if (!isValidToken) {
        return res.status(401).json({ error: '2FA-Code ungültig' });
      }
    }

    // Login-Zeit aktualisieren
    user.lastLogin = new Date();
    await user.save();

    // Token generieren
    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isTwoFactorEnabled: user.isTwoFactorEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Serverfehler beim Login' });
  }
});

// Produkte abrufen
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };

    const products = await Product.find(query)
      .populate('vendor', 'username')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await Product.countDocuments(query);

    res.status(200).json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen der Produkte' });
  }
});

// Produkt erstellen (nur für Verkäufer)
app.post('/api/products', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Nur Verkäufer können Produkte erstellen' });
    }

    const { name, description, price, category, tags, encryptedDetails } = req.body;

    const product = new Product({
      name,
      description,
      price,
      vendor: req.user._id,
      category,
      tags,
      encryptedDetails
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Erstellen des Produkts' });
  }
});

// Bestellung aufgeben
app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { products, shippingInfo, paymentMethod } = req.body;

    // Produkte validieren und Gesamtpreis berechnen
    let totalPrice = 0;
    const orderProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ error: `Produkt ${item.productId} nicht verfügbar` });
      }

      totalPrice += product.price * item.quantity;
      orderProducts.push({
        product: item.productId,
        quantity: item.quantity
      });
    }

    // Bestellung erstellen
    const order = new Order({
      buyer: req.user._id,
      products: orderProducts,
      totalPrice,
      shippingInfo,
      paymentMethod,
      transactionId: crypto.randomBytes(16).toString('hex')
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Erstellen der Bestellung' });
  }
});

// Nachricht senden
app.post('/api/messages', authMiddleware, async (req, res) => {
  try {
    const { recipientId, encryptedContent } = req.body;

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Empfänger nicht gefunden' });
    }

    const message = new Message({
      sender: req.user._id,
      recipient: recipientId,
      encryptedContent
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Senden der Nachricht' });
  }
});

// Nachrichten abrufen
app.get('/api/messages', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { recipient: req.user._id }
      ]
    })
    .populate('sender', 'username')
    .populate('recipient', 'username')
    .sort('-createdAt');

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen der Nachrichten' });
  }
});

// Benutzerprofil aktualisieren
app.put('/api/users/profile', authMiddleware, async (req, res) => {
  try {
    const { email, pgpPublicKey } = req.body;

    const updates = {};
    if (email) updates.email = email;
    if (pgpPublicKey) updates.pgpPublicKey = pgpPublicKey;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select('-passwordHash');

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Profils' });
  }
});

// 2FA aktivieren
app.post('/api/users/2fa/generate', authMiddleware, async (req, res) => {
  try {
    // Secret für den Benutzer generieren
    const secret = speakeasy.generateSecret({
      name: `SecureMarket:${req.user.username}`
    });

    // Secret in der Datenbank speichern (noch nicht aktiviert)
    await User.findByIdAndUpdate(req.user._id, {
      twoFactorSecret: secret.base32
    });

    // QR-Code als Base64 erstellen
    const qrCodeImage = await qrcode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      secret: secret.base32,
      qrCode: qrCodeImage
    });
  } catch (error) {
    res.status(500).json({ error: 'Fehler bei der 2FA-Einrichtung' });
  }
});

// 2FA aktivieren/verifizieren
app.post('/api/users/2fa/verify', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;

    // Benutzer mit Secret laden
    const user = await User.findById(req.user._id);
    if (!user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA wurde noch nicht initialisiert' });
    }

    // Token verifizieren
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!verified) {
      return res.status(400).json({ error: 'Ungültiger 2FA-Code' });
    }

    // 2FA aktivieren
    await User.findByIdAndUpdate(req.user._id, {
      isTwoFactorEnabled: true
    });

    res.status(200).json({ success: true, message: '2FA erfolgreich aktiviert' });
  } catch (error) {
    res.status(500).json({ error: 'Fehler bei der 2FA-Aktivierung' });
  }
});

// 2FA deaktivieren
app.post('/api/users/2fa/disable', authMiddleware, async (req, res) => {
  try {
    const { password, token } = req.body;

    // Benutzer mit Passwort-Hash laden
    const user = await User.findById(req.user._id);

    // Passwort überprüfen
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Ungültiges Passwort' });
    }

    // Token verifizieren
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!verified) {
      return res.status(400).json({ error: 'Ungültiger 2FA-Code' });
    }

    // 2FA deaktivieren
    await User.findByIdAndUpdate(req.user._id, {
      isTwoFactorEnabled: false,
      twoFactorSecret: null
    });

    res.status(200).json({ success: true, message: '2FA erfolgreich deaktiviert' });
  } catch (error) {
    res.status(500).json({ error: 'Fehler bei der 2FA-Deaktivierung' });
  }
});

// Passwort ändern
app.put('/api/users/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Benutzer mit Passwort-Hash abrufen
    const user = await User.findById(req.user._id);

    // Aktuelles Passwort überprüfen
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Aktuelles Passwort ist falsch' });
    }

    // Neues Passwort hashen und speichern
    user.passwordHash = await bcrypt.hash(newPassword, config.saltRounds);
    await user.save();

    res.status(200).json({ message: 'Passwort erfolgreich geändert' });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Ändern des Passworts' });
  }
});

// MongoDB verbinden und Server starten
mongoose.connect(config.mongoUri)
  .then(() => {
    console.log('MongoDB verbunden');

    // HTTPS-Server mit SSL/TLS starten
    try {
      const sslOptions = {
        key: fs.readFileSync(config.sslKey),
        cert: fs.readFileSync(config.sslCert)
      };

      https.createServer(sslOptions, app).listen(config.port, () => {
        console.log(`Secure Marketplace läuft auf Port ${config.port} (HTTPS)`);
      });
    } catch (error) {
      // Fallback auf HTTP (nur für Entwicklung)
      console.warn('SSL-Zertifikate nicht gefunden, starte HTTP-Server (nur für Entwicklung)');
      app.listen(config.port, () => {
        console.log(`Marketplace läuft auf Port ${config.port} (HTTP, nur für Entwicklung!)`);
      });
    }
  })
  .catch(err => {
    console.error('MongoDB Verbindungsfehler:', err);
    process.exit(1);
  });
