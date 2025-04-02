const Document = require('../models/Document');

// Volltextsuche
exports.searchDocuments = async (req, res) => {
  try {
    if (!req.query.q) {
      return res.status(400).json({
        success: false,
        message: 'Bitte einen Suchbegriff angeben'
      });
    }
    
    const query = req.query.q;
    
    const documents = await Document.find({
      $text: { $search: query }
    }, {
      score: { $meta: 'textScore' }
    })
    .select('title slug category tags updatedAt')
    .populate('category', 'name slug')
    .sort({ score: { $meta: 'textScore' } });
    
    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
