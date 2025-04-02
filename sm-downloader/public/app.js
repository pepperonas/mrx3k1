document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const videoUrlInput = document.getElementById('videoUrl');
    const clearBtn = document.getElementById('clearBtn');
    const platformBtns = document.querySelectorAll('.platform-btn');
    const fetchBtn = document.getElementById('fetchBtn');
    const alertMessage = document.getElementById('alertMessage');
    const resultContainer = document.getElementById('resultContainer');
    const thumbnail = document.getElementById('thumbnail');
    const duration = document.getElementById('duration');
    const videoTitle = document.getElementById('videoTitle');
    const videoSource = document.getElementById('videoSource');
    const downloadOptions = document.getElementById('downloadOptions');

    // Current state
    let selectedPlatform = 'youtube';
    let isProcessing = false;
    let currentVideoData = null;

    // API endpoint (relative path for the proxy)
    const API_ENDPOINT = 'api/fetch';
    const DOWNLOAD_ENDPOINT = 'api/download';

    // Platform data
    const platforms = {
        youtube: {
            name: 'YouTube',
            placeholder: 'https://www.youtube.com/watch?v=...',
            pattern: /(youtube\.com|youtu\.be)/i
        },
        instagram: {
            name: 'Instagram',
            placeholder: 'https://www.instagram.com/p/...',
            pattern: /instagram\.com/i
        },
        tiktok: {
            name: 'TikTok',
            placeholder: 'https://www.tiktok.com/@username/video/...',
            pattern: /tiktok\.com/i
        },
        twitter: {
            name: 'Twitter',
            placeholder: 'https://twitter.com/username/status/...',
            pattern: /(twitter\.com|x\.com)/i
        }
    };

    // Initialize
    init();

    function init() {
        // Set initial placeholder
        updatePlaceholder();

        // Setup event listeners
        setupEventListeners();
    }

    function setupEventListeners() {
        // Clear button
        clearBtn.addEventListener('click', () => {
            videoUrlInput.value = '';
            videoUrlInput.focus();
        });

        // Platform buttons
        platformBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const platform = btn.getAttribute('data-platform');
                selectPlatform(platform);
            });
        });

        // Fetch button
        fetchBtn.addEventListener('click', fetchVideoInfo);

        // URL input for auto-detection
        videoUrlInput.addEventListener('input', detectPlatform);
        videoUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !isProcessing) {
                fetchVideoInfo();
            }
        });
    }

    function updatePlaceholder() {
        videoUrlInput.placeholder = platforms[selectedPlatform].placeholder;
    }

    function selectPlatform(platform) {
        if (selectedPlatform === platform) return;

        selectedPlatform = platform;

        // Update UI
        platformBtns.forEach(btn => {
            if (btn.getAttribute('data-platform') === platform) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });

        updatePlaceholder();
    }

    function detectPlatform() {
        const url = videoUrlInput.value.trim();
        if (!url) return;

        // Check each platform's pattern
        for (const [platform, data] of Object.entries(platforms)) {
            if (data.pattern.test(url)) {
                selectPlatform(platform);
                break;
            }
        }
    }

    function isValidUrl(url, platform) {
        return platforms[platform].pattern.test(url);
    }

    function showAlert(message, type) {
        alertMessage.textContent = message;
        alertMessage.className = 'alert-message ' + type;
        alertMessage.classList.remove('hide');

        // Auto hide after 5 seconds for success/error messages
        if (type !== 'info') {
            setTimeout(() => {
                alertMessage.classList.add('hide');
            }, 5000);
        }
    }

    function setLoading(isLoading) {
        isProcessing = isLoading;

        const btnText = fetchBtn.querySelector('.btn-text');
        const spinner = fetchBtn.querySelector('.spinner');

        if (isLoading) {
            fetchBtn.disabled = true;
            btnText.textContent = 'Wird verarbeitet...';
            spinner.classList.remove('hide');
        } else {
            fetchBtn.disabled = false;
            btnText.textContent = 'Video abrufen';
            spinner.classList.add('hide');
        }
    }

    async function fetchVideoInfo() {
        const url = videoUrlInput.value.trim();

        // Validate URL
        if (!url) {
            showAlert('Bitte gib eine URL ein', 'error');
            return;
        }

        if (!isValidUrl(url, selectedPlatform)) {
            showAlert(`Dies scheint keine gültige ${platforms[selectedPlatform].name}-URL zu sein`, 'error');
            return;
        }

        // Set loading state
        setLoading(true);
        resultContainer.classList.add('hide');
        showAlert('Video wird analysiert...', 'info');

        try {
            // Fetch video information from our backend API
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: url,
                    platform: selectedPlatform
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Store the current video data
                currentVideoData = data.video;

                // Display the video information
                displayVideoInfo(currentVideoData);
                showAlert('Video erfolgreich gefunden. Wähle eine Download-Option.', 'success');
            } else {
                throw new Error(data.error || 'Beim Abrufen des Videos ist ein Fehler aufgetreten');
            }
        } catch (error) {
            console.error('Error fetching video:', error);
            showAlert(error.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    function displayVideoInfo(video) {
        console.log('Video info received:', video);

        // Thumbnail-URL überprüfen
        if (video.thumbnail) {
            // Ensure we're using absolute paths
            if (video.thumbnail.startsWith('http') || video.thumbnail.startsWith('/')) {
                thumbnail.src = video.thumbnail;
                console.log('Using provided thumbnail:', video.thumbnail);
            } else {
                // Fallback to local placeholder
                thumbnail.src = 'api/placeholder/640/360';
                console.log('Using placeholder (relative URL)');
            }
        } else {
            // Fallback to local placeholder
            thumbnail.src = 'api/placeholder/640/360';
            console.log('No thumbnail provided, using placeholder');
        }

        // Update other UI elements
        duration.textContent = video.duration || '0:00';
        videoTitle.textContent = video.title || 'Unbekanntes Video';
        videoSource.textContent = `Quelle: ${platforms[selectedPlatform].name}`;

        // Generate download options
        generateDownloadOptions(video);

        // Show the result container
        resultContainer.classList.remove('hide');
    }

    function generateDownloadOptions(video) {
        // Clear existing options
        downloadOptions.innerHTML = '';

        // Create options based on available formats
        if (video.formats && video.formats.length > 0) {
            video.formats.forEach(format => {
                const option = createDownloadOption(format);
                downloadOptions.appendChild(option);
            });
        } else {
            // Fallback if no formats are available
            const message = document.createElement('p');
            message.textContent = 'Keine Download-Optionen verfügbar für dieses Video.';
            message.style.textAlign = 'center';
            message.style.color = 'var(--text-light)';
            downloadOptions.appendChild(message);
        }
    }

    function createDownloadOption(format) {
        const option = document.createElement('div');
        option.className = 'download-option';
        option.dataset.formatId = format.formatId;

        const heading = document.createElement('h3');

        // Icon based on format type
        const iconName = format.type === 'audio' ? 'audio' : format.quality.includes('HD') ? 'hd' : 'sd';
        heading.innerHTML = `<img src="icons/${iconName}.svg" alt="${format.type}" width="20"> ${format.quality}`;

        const description = document.createElement('p');
        description.textContent = format.description || '';

        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        fileInfo.innerHTML = `
            <span>${format.container.toUpperCase()}</span>
            <span>${format.size}</span>
        `;

        const progressBar = document.createElement('div');
        progressBar.className = 'download-progress';

        option.appendChild(heading);
        option.appendChild(description);
        option.appendChild(fileInfo);
        option.appendChild(progressBar);

        // Add click event for download
        option.addEventListener('click', () => {
            startDownload(format.formatId);
        });

        return option;
    }

    async function startDownload(formatId) {
        if (!currentVideoData) return;

        // Find the option element
        const option = downloadOptions.querySelector(`.download-option[data-format-id="${formatId}"]`);
        if (!option) return;

        // Find the progress bar
        const progressBar = option.querySelector('.download-progress');

        // Set downloading state
        option.classList.add('downloading');
        showAlert('Download wird vorbereitet...', 'info');

        try {
            console.log('Starting download with formatId:', formatId);

            // Initiate download request to our backend
            const response = await fetch(DOWNLOAD_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: currentVideoData.originalUrl,
                    platform: selectedPlatform,
                    formatId: formatId
                })
            });

            if (!response.ok) {
                console.error('Download response not OK:', response.status, response.statusText);

                // Versuchen die Fehlermeldung zu lesen
                let errorText;
                try {
                    const errorData = await response.json();
                    errorText = errorData.error || response.statusText;
                } catch {
                    errorText = `HTTP-Fehler: ${response.status}`;
                }

                throw new Error(errorText);
            }

            // Anzeigen von Fortschritt während des Downloads
            progressBar.style.width = '30%';

            // Größe prüfen
            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength) < 1000) {
                console.warn('Warning: Download size is very small:', contentLength, 'bytes');
            }

            // Get response as blob for direct download
            const blob = await response.blob();
            progressBar.style.width = '60%';

            // Größe der Blob überprüfen
            if (blob.size < 1000) {
                console.warn('Warning: Blob size is very small:', blob.size, 'bytes');
            }

            // Get filename from headers or use default
            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'download';

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"|filename=([^;]+)/);
                if (filenameMatch) {
                    filename = filenameMatch[1] || filenameMatch[2];
                }
            } else {
                // Fallback filename based on video title
                const format = currentVideoData.formats.find(f => f.formatId === formatId);
                const extension = format ? format.container : 'mp4';
                filename = `${currentVideoData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
            }

            console.log('Download filename:', filename);
            progressBar.style.width = '80%';

            // Create download link and trigger click
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);

            // Verzögerung hinzufügen, um sicherzustellen, dass der Browser Zeit hat
            setTimeout(() => {
                a.click();
                progressBar.style.width = '100%';

                // Clean up
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    // Show success message
                    showAlert('Download erfolgreich gestartet!', 'success');

                    // Reset the download option
                    setTimeout(() => {
                        option.classList.remove('downloading');
                        progressBar.style.width = '0';
                    }, 1000);
                }, 100);
            }, 100);
        } catch (error) {
            console.error('Download error:', error);
            showAlert('Download fehlgeschlagen: ' + error.message, 'error');

            // Reset the download option
            option.classList.remove('downloading');
            progressBar.style.width = '0';
        }
    }
});
