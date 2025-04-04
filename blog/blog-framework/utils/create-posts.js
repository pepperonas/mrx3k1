// /utils/create-post.js
// Skript zum Erstellen eines neuen Blog-Beitrags

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Funktion zum Formatieren des Datums
const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};

// Funktion zum Erzeugen eines URL-freundlichen Slugs
const createSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Entferne Sonderzeichen
        .replace(/\s+/g, '-')     // Ersetze Leerzeichen durch Bindestriche
        .replace(/-+/g, '-');     // Entferne mehrfache Bindestriche
};

// Funktion zum Erstellen eines neuen Beitrags
const createPost = async () => {
    // Kategorie abfragen
    rl.question('Kategorie (ai, development, it-security): ', (category) => {
        if (!['ai', 'development', 'it-security'].includes(category)) {
            console.log('Ungültige Kategorie! Bitte wähle ai, development oder it-security.');
            rl.close();
            return;
        }

        // Titel abfragen
        rl.question('Titel des Beitrags: ', (title) => {
            const slug = createSlug(title);

            // Kurzbeschreibung abfragen
            rl.question('Kurzbeschreibung: ', (excerpt) => {

                // Tags abfragen
                rl.question('Tags (durch Komma getrennt): ', (tagsInput) => {
                    const tags = tagsInput.split(',').map(tag => tag.trim());

                    // Markdown-Template erstellen
                    const date = formatDate(new Date());
                    const frontMatter = `---
title: "${title}"
date: "${date}"
excerpt: "${excerpt}"
tags: [${tags.map(tag => `"${tag}"`).join(', ')}]
---

# ${title}

Hier kommt der Inhalt des Beitrags...
`;

                    // Verzeichnis prüfen und ggf. erstellen
                    const dir = path.join(__dirname, '..', 'posts', category);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, {recursive: true});
                    }

                    // Datei erstellen
                    const filePath = path.join(dir, `${slug}.md`);
                    fs.writeFileSync(filePath, frontMatter);

                    console.log(`\nBeitrag erstellt: ${filePath}`);
                    console.log(`Du kannst den Beitrag unter /blog/posts/${category}/${slug} aufrufen.`);

                    rl.close();
                });
            });
        });
    });
};

createPost();

// /utils/deploy.js
// Einfaches Deployment-Skript

const {exec} = require('child_process');
const fs = require('fs');
const path = require('path');

// Funktion zum Ausführen von Shell-Befehlen
const runCommand = (command) => {
    return new Promise((resolve, reject) => {
        console.log(`Ausführen: ${command}`);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Fehler: ${error.message}`);
                return reject(error);
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }
            console.log(stdout);
            resolve();
        });
    });
};

// Hauptfunktion für das Deployment
const deploy = async () => {
    try {
        // Verzeichnis erstellen, falls nicht vorhanden
        const deployDir = path.join(__dirname, '..', 'deploy');
        if (!fs.existsSync(deployDir)) {
            fs.mkdirSync(deployDir, {recursive: true});
        }

        // Dateien kopieren
        console.log('Dateien für Deployment vorbereiten...');
        await runCommand(`cp -r ${path.join(__dirname, '..')}/* ${deployDir}`);

        // Node_modules ausschließen
        await runCommand(`rm -rf ${path.join(deployDir, 'node_modules')}`);

        // Deployment auf den Server
        // Ersetze USER und SERVER_ADDRESS mit deinen Daten
        console.log('Deployment auf Server starten...');
        await runCommand(`rsync -avz --delete ${deployDir}/ USER@SERVER_ADDRESS:/pfad/zum/blog/verzeichnis/`);

        // SSH-Befehle zum Neustart des Servers (falls nötig)
        await runCommand(`ssh USER@SERVER_ADDRESS "cd /pfad/zum/blog/verzeichnis && npm install && pm2 restart blog-app || pm2 start app.js --name blog-app"`);

        console.log('Deployment erfolgreich abgeschlossen!');
    } catch (error) {
        console.error('Deployment fehlgeschlagen:', error);
    }
};

// Deployment starten
deploy();