const matter = require('gray-matter');
const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js');

const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return '<pre class="hljs"><code>' +
                    hljs.highlight(str, {language: lang, ignoreIllegals: true}).value +
                    '</code></pre>';
            } catch (__) {
            }
        }
        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
    }
});

function parseFrontMatter(content) {
    return matter(content);
}

function renderMarkdown(content) {
    return md.render(content);
}

module.exports = {
    parseFrontMatter,
    renderMarkdown
};