const Category = require('../models/Category');

// Alle Kategorien abrufen
exports.getAllCategories = async (req, res) => {
  try {
    let query;
    
    // Kategorien mit Unterkategorien und Dokumenten abrufen
    if (req.query.populate) {
      query = Category.find().populate({
        path: 'documents',
        select: 'title slug updatedAt'
      });
    } else {
      query = Category.find();
    }
    
    // Nur Hauptkategorien abrufen
    if (req.query.parentOnly === 'true') {
      query = query.where('parentCategory').equals(null);
    }
    
    const categories = await query;
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Einzelne Kategorie abrufen
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate({
      path: 'documents',
      select: 'title slug updatedAt'
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategorie nicht gefunden'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Kategorie per Slug abrufen
exports.getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug }).populate({
      path: 'documents',
      select: 'title slug updatedAt'
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategorie nicht gefunden'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Neue Kategorie erstellen
exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Kategorie aktualisieren
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategorie nicht gefunden'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Kategorie löschen
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategorie nicht gefunden'
      });
    }
    
    await category.remove();
    
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
