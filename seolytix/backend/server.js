const express = require('express');
const cors = require('cors');
const seoRoutes = require('./routes/seoRoutes');

const app = express();
const PORT = process.env.PORT || 5010;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/seo', seoRoutes);

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
