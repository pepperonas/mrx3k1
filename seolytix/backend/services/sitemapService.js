// services/sitemapService.js - Service zur Analyse der Sitemap

const axios = require('axios');
const cheerio = require('cheerio');
const {URL} = require('url');
const xml2js = require('xml2js');

/**
 * Analysiert die Sitemap einer Webseite
 * @param {Object} $ - Cheerio-Instanz mit geladenem HTML
 * @param {string} url - URL der zu analysierenden Website
 * @returns {Object} Analyse der Sitemap
 */
exports.analyzeSitemap = async ($, url) => {
    try {
        // Extrahiere Basis-URL für relative Pfade
        const baseUrl = new URL(url);

        // Suche nach Sitemap-Link im HTML
        const sitemapLinkInHtml = $('link[rel="sitemap"]').attr('href') ||
            $('a[href*="sitemap.xml"]').attr('href');

        // Normalisiere Sitemap-URL falls vorhanden
        let sitemapUrl = null;
        if (sitemapLinkInHtml) {
            sitemapUrl = new URL(sitemapLinkInHtml, baseUrl.origin).href;
        }

        // Wenn keine Sitemap im HTML gefunden wurde, prüfe robots.txt
        if (!sitemapUrl) {
            const robotsTxtUrl = `${baseUrl.origin}/robots.txt`;
            try {
                const robotsResponse = await axios.get(robotsTxtUrl, {timeout: 5000});
                const robotsTxtContent = robotsResponse.data;

                // Suche nach Sitemap-Eintrag in robots.txt
                const sitemapMatch = robotsTxtContent.match(/^Sitemap:\s*(.+)$/im);
                if (sitemapMatch && sitemapMatch[1]) {
                    sitemapUrl = sitemapMatch[1].trim();
                }
            } catch (error) {
                console.log('Konnte robots.txt nicht abrufen:', error.message);
            }
        }

        // Wenn immer noch keine Sitemap gefunden wurde, versuche standardmäßige Pfade
        if (!sitemapUrl) {
            // Versuche übliche Sitemap-Pfade
            const commonSitemapPaths = [
                '/sitemap.xml',
                '/sitemap_index.xml',
                '/sitemap.php',
                '/sitemap.txt'
            ];

            for (const path of commonSitemapPaths) {
                try {
                    const testUrl = `${baseUrl.origin}${path}`;
                    const response = await axios.head(testUrl, {timeout: 3000});

                    if (response.status === 200) {
                        sitemapUrl = testUrl;
                        break;
                    }
                } catch (error) {
                    // Pfad nicht gefunden, nächsten versuchen
                }
            }
        }

        // Wenn immer noch keine Sitemap gefunden wurde
        if (!sitemapUrl) {
            return {
                exists: false,
                score: 30,
                message: 'Keine Sitemap gefunden. Eine Sitemap hilft Suchmaschinen, Ihre Website besser zu verstehen und zu indexieren.',
                details: {
                    sitemapUrl: null,
                    urlCount: 0,
                    isSitemapIndex: false
                }
            };
        }

        // Sitemap abrufen und analysieren
        try {
            const sitemapResponse = await axios.get(sitemapUrl, {timeout: 8000});
            const sitemapContent = sitemapResponse.data;

            // Prüfen, ob es sich um eine Sitemap oder Sitemap-Index handelt
            const isSitemapIndex = sitemapContent.includes('<sitemapindex');

            // XML parsen
            const parser = new xml2js.Parser({explicitArray: false});
            const parsedXml = await parser.parseStringPromise(sitemapContent);

            // Analyse basierend auf Sitemap-Typ
            let urlCount = 0;
            let childSitemaps = [];

            if (isSitemapIndex) {
                // Handle Sitemap Index
                const sitemaps = parsedXml.sitemapindex.sitemap;
                childSitemaps = Array.isArray(sitemaps) ? sitemaps : [sitemaps];

                // Zähle URLs in den ersten 3 untergeordneten Sitemaps (um Zeit zu sparen)
                for (let i = 0; i < Math.min(3, childSitemaps.length); i++) {
                    try {
                        const childSitemapUrl = childSitemaps[i].loc;
                        const childResponse = await axios.get(childSitemapUrl, {timeout: 5000});
                        const childContent = childResponse.data;

                        const childParser = new xml2js.Parser({explicitArray: false});
                        const childParsed = await childParser.parseStringPromise(childContent);

                        const childUrls = childParsed.urlset.url;
                        const childUrlCount = Array.isArray(childUrls) ? childUrls.length : 1;
                        urlCount += childUrlCount;
                    } catch (error) {
                        console.error(`Fehler beim Abrufen der Kind-Sitemap: ${error.message}`);
                    }
                }

                // Schätzen der Gesamtzahl von URLs basierend auf den analysierten Sitemaps
                urlCount = Math.round(urlCount / Math.min(3, childSitemaps.length) * childSitemaps.length);
            } else {
                // Handle einzelne Sitemap
                const urls = parsedXml.urlset.url;
                urlCount = Array.isArray(urls) ? urls.length : 1;
            }

            // Score und Nachricht basierend auf der Analyse
            let score = 0;
            let message = '';

            if (urlCount === 0) {
                score = 40;
                message = 'Sitemap gefunden, enthält aber keine URLs.';
            } else if (urlCount < 5) {
                score = 60;
                message = `Sitemap gefunden mit ${urlCount} URLs. Die Sitemap ist möglicherweise unvollständig.`;
            } else if (isSitemapIndex) {
                score = 100;
                message = `Sitemap-Index gefunden mit ${childSitemaps.length} Sitemaps und schätzungsweise ${urlCount} URLs.`;
            } else {
                score = urlCount > 20 ? 100 : 80;
                message = `Sitemap gefunden mit ${urlCount} URLs.`;
            }

            return {
                exists: true,
                score,
                message,
                details: {
                    sitemapUrl,
                    urlCount,
                    isSitemapIndex,
                    childSitemapCount: isSitemapIndex ? childSitemaps.length : 0
                }
            };

        } catch (error) {
            return {
                exists: true,
                score: 20,
                message: `Sitemap-URL gefunden (${sitemapUrl}), aber beim Abrufen oder Parsen ist ein Fehler aufgetreten: ${error.message}`,
                details: {
                    sitemapUrl,
                    urlCount: 0,
                    isSitemapIndex: false,
                    error: error.message
                }
            };
        }

    } catch (error) {
        console.error('Fehler bei der Sitemap-Analyse:', error);
        return {
            exists: false,
            score: 0,
            message: `Fehler bei der Sitemap-Analyse: ${error.message}`,
            details: {
                sitemapUrl: null,
                urlCount: 0,
                isSitemapIndex: false,
                error: error.message
            }
        };
    }
};