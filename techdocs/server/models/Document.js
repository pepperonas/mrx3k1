const mongoose = require('mongoose');
const slugify = require('slugify');

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Bitte einen Titel angeben'],
    trim: true,
    maxlength: [100, 'Titel darf nicht mehr als 100 Zeichen haben']
  },
  slug: {
    type: String,
    unique: true
  },
  content: {
    type: String,
    required: [true, 'Bitte Inhalt angeben']
  },
  contentType: {
    type: String,
    enum: ['markdown', 'html'],
    default: 'markdown'
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: [true, 'Bitte eine Kategorie angeben']
  },
  tags: [String],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Slug vor dem Speichern erstellen
DocumentSchema.pre('save', function(next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

// Volltextsuche konfigurieren
DocumentSchema.index({
  title: 'text',
  content: 'text',
  tags: 'text'
});

module.exports = mongoose.model('Document', DocumentSchema);
