const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function testDirectUpload() {
    try {
        console.log('Testing direct upload to API...');

        // Erstelle ein FormData-Objekt
        const formData = new FormData();

        // Füge eine Testdatei hinzu (du kannst hier eine beliebige Audiodatei verwenden)
        // Ersetze 'test.mp3' mit dem Pfad zu einer echten MP3-Datei
        formData.append('files', fs.createReadStream('test.mp3'));
        formData.append('model', 'htdemucs');
        formData.append('format', 'mp3');

        // Sende die Anfrage direkt an den lokalen Server
        const response = await axios.post('http://localhost:4992/api/upload', formData, {
            headers: formData.getHeaders()
        });

        console.log('Upload successful!');
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Upload failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Status code:', error.response.status);
        }
    }
}

testDirectUpload();