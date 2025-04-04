const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { parseFrontMatter, renderMarkdown } = require('../utils/markdownParser');

router.get('/:category/:slug', (req, res, next) => {
    try {
        const { category, slug } = req.params;
        const filePath = path.join(__dirname, '..', 'posts', category, `${slug}.md`);

        if (!fs.existsSync(filePath)) {
            return res.status(404).render('404', {
                title: 'Beitrag nicht gefunden',
                message: `Der Beitrag wurde nicht gefunden.`
            });
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const { data, content: markdownContent } = parseFrontMatter(content);
        const htmlContent = renderMarkdown(markdownContent);

        res.render('post', {
            post: {
                title: data.title,
                date: data.date,
                category,
                content: htmlContent,
                tags: data.tags || []
            },
            title: data.title
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;