const mongoose = require('mongoose');
const slugify = require('slugify');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Bitte einen Namen angeben'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name darf nicht mehr als 50 Zeichen haben']
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    maxlength: [500, 'Beschreibung darf nicht mehr als 500 Zeichen haben']
  },
  parentCategory: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuelle Dokumente (Rückbezug) für Kategorien
CategorySchema.virtual('documents', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'category',
  justOne: false
});

// Slug vor dem Speichern erstellen
CategorySchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

module.exports = mongoose.model('Category', CategorySchema);
