const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/', (req, res, next) => {
    try {
        // Get categories and recent posts
        const categories = ['ai', 'development', 'it-security'];
        const recentPosts = [];

        // Get 2 most recent posts from each category
        categories.forEach(category => {
            const categoryPath = path.join(__dirname, '..', 'posts', category);

            try {
                if (fs.existsSync(categoryPath)) {
                    const posts = fs.readdirSync(categoryPath)
                        .filter(file => file.endsWith('.md'))
                        .map(file => {
                            const content = fs.readFileSync(path.join(categoryPath, file), 'utf8');
                            const {data} = require('../utils/markdownParser').parseFrontMatter(content);
                            return {
                                slug: file.replace('.md', ''),
                                title: data.title,
                                date: data.date,
                                category: category,
                                excerpt: data.excerpt || ''
                            };
                        })
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 2);

                    recentPosts.push(...posts);
                }
            } catch (err) {
                console.error(`Error reading category ${category}:`, err);
            }
        });

        // Sort all posts by date
        recentPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.render('index', {
            categories,
            recentPosts: recentPosts.slice(0, 6),
            title: 'IT Blog - AI, Development, IT-Security'
        });
    } catch (err) {
        next(err);
    }
});

// Test error route - Nur für Entwicklungszwecke
router.get('/test-error', (req, res, next) => {
    const error = new Error('Dies ist ein Test-Fehler');
    error.status = 500;
    next(error);
});

router.get('/category/:category', (req, res, next) => {
    try {
        const category = req.params.category;
        const categoryPath = path.join(__dirname, '..', 'posts', category);

        if (!fs.existsSync(categoryPath)) {
            return res.status(404).render('404', {
                title: 'Kategorie nicht gefunden',
                message: `Die Kategorie "${category}" existiert nicht.`
            });
        }

        const posts = fs.readdirSync(categoryPath)
            .filter(file => file.endsWith('.md'))
            .map(file => {
                const content = fs.readFileSync(path.join(categoryPath, file), 'utf8');
                const {data} = require('../utils/markdownParser').parseFrontMatter(content);
                return {
                    slug: file.replace('.md', ''),
                    title: data.title,
                    date: data.date,
                    category: category,
                    excerpt: data.excerpt || ''
                };
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        res.render('category', {
            category,
            posts,
            title: `${category.charAt(0).toUpperCase() + category.slice(1)} - IT Blog`
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;