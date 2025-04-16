const express = require('express');
const cors = require('cors');
const seoRoutes = require('./routes/seoRoutes');
const aiRoutes = require('./routes/aiRoutes');
const competitorRoutes = require('./routes/competitorRoutes');
const contentGeneratorRoutes = require('./routes/contentGeneratorRoutes');
const crawlRoutes = require('./routes/crawlRoutes');

const app = express();
const PORT = process.env.PORT || 5010;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Erhöhtes Limit für größere Anfragen

// Routes
app.use('/api/seo', seoRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/competitors', competitorRoutes);
app.use('/api/content', contentGeneratorRoutes);
app.use('/api/crawl', crawlRoutes);

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});