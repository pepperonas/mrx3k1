const Document = require('../models/Document');
const path = require('path');
const fs = require('fs');
const marked = require('marked');

// Alle Dokumente abrufen
exports.getAllDocuments = async (req, res) => {
  try {
    let query;
    
    // Kopie der Query-Parameter erstellen
    const reqQuery = { ...req.query };
    
    // Felder zum Ausschließen
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);
    
    // Query-String erstellen
    let queryStr = JSON.stringify(reqQuery);
    
    // Operatoren für Filterung hinzufügen ($gt, $gte, etc.)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Query ausführen
    query = Document.find(JSON.parse(queryStr)).populate('category', 'name slug');
    
    // Auswahl spezifischer Felder
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }
    
    // Sortierung
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    
    // Paginierung
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Document.countDocuments();
    
    query = query.skip(startIndex).limit(limit);
    
    // Ergebnisse abrufen
    const documents = await query;
    
    // Paginierungsergebnis
    const pagination = {};
    
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.status(200).json({
      success: true,
      count: documents.length,
      pagination,
      data: documents
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Einzelnes Dokument abrufen
exports.getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).populate('category', 'name slug');
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Dokument nicht gefunden'
      });
    }
    
    res.status(200).json({
      success: true,
      data: document
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Dokument per Slug abrufen
exports.getDocumentBySlug = async (req, res) => {
  try {
    const document = await Document.findOne({ slug: req.params.slug }).populate('category', 'name slug');
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Dokument nicht gefunden'
      });
    }
    
    // Markdown zu HTML konvertieren, wenn nötig
    if (document.contentType === 'markdown') {
      document.renderedContent = marked.parse(document.content);
    }
    
    res.status(200).json({
      success: true,
      data: document
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Neues Dokument erstellen
exports.createDocument = async (req, res) => {
  try {
    // Benutzer hinzufügen, wenn authentifiziert
    if (req.user) {
      req.body.createdBy = req.user.id;
    }
    
    const document = await Document.create(req.body);
    
    res.status(201).json({
      success: true,
      data: document
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Dokument aktualisieren
exports.updateDocument = async (req, res) => {
  try {
    let document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Dokument nicht gefunden'
      });
    }
    
    // Aktualisierungsdatum setzen
    req.body.updatedAt = Date.now();
    
    document = await Document.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: document
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Dokument löschen
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Dokument nicht gefunden'
      });
    }
    
    await document.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Markdown-Datei importieren
exports.importMarkdownFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bitte eine Markdown-Datei hochladen' 
      });
    }
    
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Titel aus dem Dateinamen extrahieren
    const fileName = path.basename(req.file.originalname, path.extname(req.file.originalname));
    const title = fileName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    const newDocument = {
      title,
      content: fileContent,
      contentType: 'markdown',
      category: req.body.category,
      tags: req.body.tags ? req.body.tags.split(',') : []
    };
    
    if (req.user) {
      newDocument.createdBy = req.user.id;
    }
    
    const document = await Document.create(newDocument);
    
    // Temporäre Datei löschen
    fs.unlinkSync(filePath);
    
    res.status(201).json({
      success: true,
      data: document
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
