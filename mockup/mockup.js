document.addEventListener('DOMContentLoaded', function () {
    // DOM elements for terminal mockup
    const terminalOutput = document.getElementById('terminal-output');
    const terminalTitleInput = document.getElementById('terminal-title-input');
    const promptInput = document.getElementById('prompt-input');
    const displayTitle = document.getElementById('display-title');
    const displayPrompt = document.getElementById('display-prompt');
    const customText = document.getElementById('custom-text');
    const contentTypeSelect = document.getElementById('content-type');
    const textControls = document.getElementById('text-controls');
    const imageControls = document.getElementById('image-controls');
    const asciiControls = document.getElementById('ascii-controls');
    const imageUpload = document.getElementById('image-upload');
    const imageWidth = document.getElementById('image-width');
    const imageCenter = document.getElementById('image-center');
    const asciiSelection = document.getElementById('ascii-selection');
    const themeSelector = document.getElementById('theme-selector');
    const updateButton = document.getElementById('update-mockup');
    const downloadButton = document.getElementById('download-mockup');
    const mockupTerminal = document.getElementById('mockup-terminal');

    // DOM elements for smartphone mockup
    const mockupSmartphone = document.getElementById('mockup-smartphone');
    const phoneModel = document.getElementById('phone-model');
    const phoneColor = document.getElementById('phone-color');
    const screenContentType = document.getElementById('screen-content-type');
    const screenshotControls = document.getElementById('screenshot-controls');
    const appControls = document.getElementById('app-controls');
    const browserControls = document.getElementById('browser-controls');
    const customScreenControls = document.getElementById('custom-screen-controls');
    const screenshotUpload = document.getElementById('screenshot-upload');
    const appTitle = document.getElementById('app-title');
    const appContent = document.getElementById('app-content');
    const browserUrl = document.getElementById('browser-url');
    const browserContent = document.getElementById('browser-content');
    const customScreenContent = document.getElementById('custom-screen-content');
    const showBattery = document.getElementById('show-battery');
    const showWifi = document.getElementById('show-wifi');
    const showSignal = document.getElementById('show-signal');
    const showTime = document.getElementById('show-time');
    const statusBarStyle = document.getElementById('status-bar-style');
    const smartphoneContent = document.getElementById('smartphone-content');

    // DOM elements for tablet mockup
    const mockupTablet = document.getElementById('mockup-tablet');
    const tabletModel = document.getElementById('tablet-model');
    const tabletOrientation = document.getElementById('tablet-orientation');
    const tabletColor = document.getElementById('tablet-color');
    const tabletContentType = document.getElementById('tablet-content-type');
    const tabletScreenshotControls = document.getElementById('tablet-screenshot-controls');
    const tabletAppControls = document.getElementById('tablet-app-controls');
    const tabletSplitviewControls = document.getElementById('tablet-splitview-controls');
    const tabletBrowserControls = document.getElementById('tablet-browser-controls');
    const tabletCustomScreenControls = document.getElementById('tablet-custom-screen-controls');
    const tabletScreenshotUpload = document.getElementById('tablet-screenshot-upload');
    const tabletAppTitle = document.getElementById('tablet-app-title');
    const tabletAppContent = document.getElementById('tablet-app-content');
    const tabletSplitviewLeftTitle = document.getElementById('tablet-splitview-left-title');
    const tabletSplitviewLeftContent = document.getElementById('tablet-splitview-left-content');
    const tabletSplitviewRightTitle = document.getElementById('tablet-splitview-right-title');
    const tabletSplitviewRightContent = document.getElementById('tablet-splitview-right-content');
    const tabletSplitRatio = document.getElementById('tablet-split-ratio');
    const tabletBrowserUrl = document.getElementById('tablet-browser-url');
    const tabletBrowserContent = document.getElementById('tablet-browser-content');
    const tabletCustomScreenContent = document.getElementById('tablet-custom-screen-content');
    const tabletShowBattery = document.getElementById('tablet-show-battery');
    const tabletShowWifi = document.getElementById('tablet-show-wifi');
    const tabletShowTime = document.getElementById('tablet-show-time');
    const tabletStatusBarStyle = document.getElementById('tablet-status-bar-style');
    const tabletContent = document.getElementById('tablet-content');

    // Mockup type selection
    const mockupTypeRadios = document.querySelectorAll('input[name="mockup-type"]');
    const terminalControls = document.getElementById('terminal-controls');
    const smartphoneControls = document.getElementById('smartphone-controls');
    const tabletControls = document.getElementById('tablet-controls');

    // Custom background color elements
    const customBgColor = document.getElementById('custom-bg-color');
    const colorPicker = document.getElementById('color-picker');
    const applyBgColor = document.getElementById('apply-bg-color');
    const useCustomBg = document.getElementById('use-custom-bg');

    // DOM elements for smartphone custom background
    const smartphoneCustomBgColor = document.getElementById('smartphone-custom-bg-color');
    const smartphoneColorPicker = document.getElementById('smartphone-color-picker');
    const smartphoneApplyBgColor = document.getElementById('smartphone-apply-bg-color');
    const smartphoneUseCustomBg = document.getElementById('smartphone-use-custom-bg');

// DOM elements for tablet custom background
    const tabletCustomBgColor = document.getElementById('tablet-custom-bg-color');
    const tabletColorPicker = document.getElementById('tablet-color-picker');
    const tabletApplyBgColor = document.getElementById('tablet-apply-bg-color');
    const tabletUseCustomBg = document.getElementById('tablet-use-custom-bg');

    // ASCII art collection
    const asciiArt = {
        tux: `
    .--.
   |o_o |
   |:_/ |
  //   \\ \\
 (|     | )
/'\\_   _/\`\\
\\___)=(___/
        `,
        computer: `
     ,----------------,
    ,-----------------------,
  ,\"                      \",
 +--------------------------|
 |                          |
 |   .----------------------+
 |   |                     ||
 |   |                     ||
 |   |                     ||
 |   |                     ||
 |   '-----------------------+
 |                          |
 |                          |
 |                          |
 |                          |
 '--------------------------'
        `,
        linux: `
    _nnnn_
   dGGGGMMb
  @p~qp~~qMb
  M|@||@) M|
  @,----.JM|
 JS^\\__/  qKL
dZP        qKRb
dZP          qKKb
fZP            SMMb
HZM            MMMM
FqM            MMMM
__| ".        |\\dS"qML
|    \`.       | \`' \\Zq
_)      \\.___.,|     .'
\\____   )MMMMMP|   .'
     \`-'       \`--'
        `
    };

    // Initialize current mockup type
    let currentMockupType = 'terminal';

    // ======= Event Listeners =======

    // Mockup type selection
    mockupTypeRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            currentMockupType = this.value;
            toggleMockupType();
        });
    });

    // Sync color picker with text input
    colorPicker.addEventListener('input', function () {
        customBgColor.value = this.value;
    });

    customBgColor.addEventListener('input', function () {
        // Validate hex color
        if (/^#[0-9A-F]{6}$/i.test(this.value)) {
            colorPicker.value = this.value;
        }
    });

    // Apply custom background color
    applyBgColor.addEventListener('click', function () {
        if (useCustomBg.checked) {
            applyCustomBgColor();
        }
    });

    // Toggle custom background color
    useCustomBg.addEventListener('change', function () {
        if (this.checked) {
            applyCustomBgColor();
        } else {
            // Reapply current theme
            applyTheme(themeSelector.value);
        }
    });

    // Phone model change
    phoneModel.addEventListener('change', function () {
        updatePhoneModel();
    });

    // Phone color change
    phoneColor.addEventListener('change', function () {
        updatePhoneColor();
    });

    // Screen content type change
    screenContentType.addEventListener('change', function () {
        toggleScreenContentControls();
    });

    // Status bar style change
    statusBarStyle.addEventListener('change', function () {
        updateStatusBarStyle();
    });

    // Show/hide status bar elements
    showBattery.addEventListener('change', toggleStatusBarElements);
    showWifi.addEventListener('change', toggleStatusBarElements);
    showSignal.addEventListener('change', toggleStatusBarElements);
    showTime.addEventListener('change', toggleStatusBarElements);

    // Terminal content type change
    contentTypeSelect.addEventListener('change', toggleContentControls);

    // Theme selector change
    themeSelector.addEventListener('change', function () {
        applyTheme(this.value);
    });

    // Tablet model change
    tabletModel.addEventListener('change', function () {
        updateTabletModel();
    });

    // Tablet orientation change
    tabletOrientation.addEventListener('change', function () {
        updateTabletOrientation();
        updateTabletDimensions(); // Update dimensions text when orientation changes
    });

    // Tablet color change
    tabletColor.addEventListener('change', function () {
        updateTabletColor();
    });

    // Tablet content type change
    tabletContentType.addEventListener('change', function () {
        toggleTabletContentControls();
    });

    // Tablet status bar style change
    tabletStatusBarStyle.addEventListener('change', function () {
        updateTabletStatusBarStyle();
    });

    // Show/hide tablet status bar elements
    tabletShowBattery.addEventListener('change', toggleTabletStatusBarElements);
    tabletShowWifi.addEventListener('change', toggleTabletStatusBarElements);
    tabletShowTime.addEventListener('change', toggleTabletStatusBarElements);

    // Update button
    updateButton.addEventListener('click', updateMockup);

    // Download button
    downloadButton.addEventListener('click', downloadMockup);

    // Smartphone color picker sync
    smartphoneColorPicker.addEventListener('input', function () {
        smartphoneCustomBgColor.value = this.value;
    });

    smartphoneCustomBgColor.addEventListener('input', function () {
        // Validate hex color
        if (/^#[0-9A-F]{6}$/i.test(this.value)) {
            smartphoneColorPicker.value = this.value;
        }
    });

// Apply smartphone custom background color
    smartphoneApplyBgColor.addEventListener('click', function () {
        if (smartphoneUseCustomBg.checked) {
            applySmartphoneCustomBgColor();
        }
    });

// Toggle smartphone custom background color
    smartphoneUseCustomBg.addEventListener('change', function () {
        if (this.checked) {
            applySmartphoneCustomBgColor();
        } else {
            // Reset to default
            document.querySelector('.smartphone-content').style.backgroundColor = '';
        }
    });

// Tablet color picker sync
    tabletColorPicker.addEventListener('input', function () {
        tabletCustomBgColor.value = this.value;
    });

    tabletCustomBgColor.addEventListener('input', function () {
        // Validate hex color
        if (/^#[0-9A-F]{6}$/i.test(this.value)) {
            tabletColorPicker.value = this.value;
        }
    });

// Apply tablet custom background color
    tabletApplyBgColor.addEventListener('click', function () {
        if (tabletUseCustomBg.checked) {
            applyTabletCustomBgColor();
        }
    });

// Toggle tablet custom background color
    tabletUseCustomBg.addEventListener('change', function () {
        if (this.checked) {
            applyTabletCustomBgColor();
        } else {
            // Reset to default
            document.querySelector('.tablet-content').style.backgroundColor = '';
        }
    });

// Apply smartphone custom background color
    function applySmartphoneCustomBgColor() {
        let color = smartphoneCustomBgColor.value;

        // Validate hex color, default to white if invalid
        if (!/^#[0-9A-F]{6}$/i.test(color)) {
            color = '#ffffff';
            smartphoneCustomBgColor.value = color;
            smartphoneColorPicker.value = color;
        }

        // Apply color to smartphone content
        document.querySelector('.smartphone-content').style.backgroundColor = color;
    }

// Apply tablet custom background color
    function applyTabletCustomBgColor() {
        let color = tabletCustomBgColor.value;

        // Validate hex color, default to white if invalid
        if (!/^#[0-9A-F]{6}$/i.test(color)) {
            color = '#ffffff';
            tabletCustomBgColor.value = color;
            tabletColorPicker.value = color;
        }

        // Apply color to tablet content
        document.querySelector('.tablet-content').style.backgroundColor = color;
    }

    // ======= Functions =======

    // Toggle between terminal, smartphone and tablet mockup
    function toggleMockupType() {
        // Scrollposition merken
        const scrollPosition = window.scrollY;

        // Alle Mockups ausblenden
        mockupTerminal.style.display = 'none';
        mockupSmartphone.style.display = 'none';
        mockupTablet.style.display = 'none';

        // Alle Dimensionstexte ausblenden
        document.getElementById('terminal-dimensions').style.display = 'none';
        document.getElementById('smartphone-dimensions').style.display = 'none';
        document.getElementById('tablet-dimensions').style.display = 'none';

        // Alle Steuerelemente ausblenden
        terminalControls.style.display = 'none';
        smartphoneControls.style.display = 'none';
        tabletControls.style.display = 'none';

        // Jetzt das ausgewählte Mockup, dessen Steuerelemente und Dimensionstext anzeigen
        if (currentMockupType === 'terminal') {
            mockupTerminal.style.display = 'flex';
            document.getElementById('terminal-dimensions').style.display = 'block';
            terminalControls.style.display = 'block';
            console.log("Terminal-Modus aktiviert");
        } else if (currentMockupType === 'smartphone') {
            mockupSmartphone.style.display = 'flex';
            document.getElementById('smartphone-dimensions').style.display = 'block';
            smartphoneControls.style.display = 'block';
            console.log("Smartphone-Modus aktiviert");
            toggleScreenContentControls();
        } else if (currentMockupType === 'tablet') {
            mockupTablet.style.display = 'flex';
            document.getElementById('tablet-dimensions').style.display = 'block';
            tabletControls.style.display = 'block';
            console.log("Tablet-Modus aktiviert");
            toggleTabletContentControls();
            updateTabletDimensions(); // Update dimensions for current orientation
        }

        // Scrollposition wiederherstellen
        window.scrollTo(0, scrollPosition);
    }

    function updateTabletDimensions() {
        const orientation = document.getElementById('tablet-orientation').value;
        const tabletSizeText = document.getElementById('tablet-size-text');

        if (orientation === 'landscape') {
            tabletSizeText.textContent = '770 × 570 px | Ratio: 1.3 : 1';
        } else { // portrait
            tabletSizeText.textContent = '570 × 770 px | Ratio: 1 : 1.3';
        }
    }

    function initializeFixedPanel() {
        // Hide all controls
        terminalControls.style.display = 'none';
        smartphoneControls.style.display = 'none';
        tabletControls.style.display = 'none';

        // Activate terminal as default
        terminalControls.style.display = 'block';

        // Keep original English button text instead of translating to German
        if (document.getElementById('update-mockup')) {
            document.getElementById('update-mockup').textContent = 'Update Mockup';
        }

        if (document.getElementById('download-mockup')) {
            document.getElementById('download-mockup').textContent = 'Download Mockup';
        }

        // Keep original English dropdown options instead of translating to German
        const contentTypeSelect = document.getElementById('content-type');
        if (contentTypeSelect) {
            Array.from(contentTypeSelect.options).forEach(option => {
                if (option.value === 'text') option.textContent = 'Text';
                if (option.value === 'image') option.textContent = 'Image';
                if (option.value === 'ascii-art') option.textContent = 'ASCII Art';
            });
        }
    }

    // Toggle terminal content controls based on selected type
    function toggleContentControls() {
        const contentType = contentTypeSelect.value;

        textControls.style.display = contentType === 'text' ? 'block' : 'none';
        imageControls.style.display = contentType === 'image' ? 'block' : 'none';
        asciiControls.style.display = contentType === 'ascii-art' ? 'block' : 'none';
    }

    // Verbesserte toggleScreenContentControls-Funktion
    function toggleScreenContentControls() {
        const contentType = screenContentType.value;

        console.log("Smartphone Content-Typ geändert zu:", contentType);

        // Alle Content-Controls ausblenden
        if (screenshotControls) screenshotControls.style.display = 'none';
        if (appControls) appControls.style.display = 'none';
        if (browserControls) browserControls.style.display = 'none';
        if (customScreenControls) customScreenControls.style.display = 'none';

        // Ausgewählte Content-Controls anzeigen
        switch (contentType) {
            case 'screenshot':
                if (screenshotControls) screenshotControls.style.display = 'block';
                break;
            case 'app':
                if (appControls) appControls.style.display = 'block';
                break;
            case 'browser':
                if (browserControls) browserControls.style.display = 'block';
                break;
            case 'custom':
                if (customScreenControls) customScreenControls.style.display = 'block';
                break;
        }
    }

// Verbesserte toggleTabletContentControls-Funktion
    function toggleTabletContentControls() {
        const contentType = tabletContentType.value;

        console.log("Tablet Content-Typ geändert zu:", contentType);

        // Alle Content-Controls ausblenden
        if (tabletScreenshotControls) tabletScreenshotControls.style.display = 'none';
        if (tabletAppControls) tabletAppControls.style.display = 'none';
        if (tabletSplitviewControls) tabletSplitviewControls.style.display = 'none';
        if (tabletBrowserControls) tabletBrowserControls.style.display = 'none';
        if (tabletCustomScreenControls) tabletCustomScreenControls.style.display = 'none';

        // Ausgewählte Content-Controls anzeigen
        switch (contentType) {
            case 'screenshot':
                if (tabletScreenshotControls) tabletScreenshotControls.style.display = 'block';
                break;
            case 'app':
                if (tabletAppControls) tabletAppControls.style.display = 'block';
                break;
            case 'splitview':
                if (tabletSplitviewControls) tabletSplitviewControls.style.display = 'block';
                break;
            case 'browser':
                if (tabletBrowserControls) tabletBrowserControls.style.display = 'block';
                break;
            case 'custom':
                if (tabletCustomScreenControls) tabletCustomScreenControls.style.display = 'block';
                break;
        }
    }

    // Apply custom background color
    function applyCustomBgColor() {
        let color = customBgColor.value;

        // Validate hex color, default to black if invalid
        if (!/^#[0-9A-F]{6}$/i.test(color)) {
            color = '#000000';
            customBgColor.value = color;
            colorPicker.value = color;
        }

        // Apply color to terminal body and container
        document.querySelector('.terminal-body').style.backgroundColor = color;
        mockupTerminal.style.backgroundColor = color;
    }

    // Apply terminal theme
    function applyTheme(theme) {
        // Reset custom background color styles
        document.querySelector('.terminal-body').style.backgroundColor = '';
        mockupTerminal.style.backgroundColor = '';

        // Get all current classes
        const currentClasses = mockupTerminal.className.split(' ');

        // Remove any theme classes (classes that start with 'theme-')
        const nonThemeClasses = currentClasses.filter(className => !className.startsWith('theme-'));

        // Set the terminal container back to only non-theme classes
        mockupTerminal.className = nonThemeClasses.join(' ');

        // Add the selected theme class if it's not 'nord' (default)
        if (theme !== 'nord') {
            mockupTerminal.classList.add('theme-' + theme);
        }

        // If custom background is enabled, reapply it
        if (useCustomBg && useCustomBg.checked) {
            applyCustomBgColor();
        }
    }

    // Update phone model
    function updatePhoneModel() {
        const model = phoneModel.value;
        const smartphoneFrame = document.querySelector('.smartphone-frame');

        // Remove any existing model classes
        smartphoneFrame.classList.remove('iphone', 'android', 'pixel', 'samsung');

        // Add selected model class
        smartphoneFrame.classList.add(model);

        // Add/remove notch and home button based on model
        const notch = document.querySelector('.smartphone-notch');
        const homeButton = document.querySelector('.home-button');

        if (model === 'iphone') {
            if (!notch) {
                const notchElement = document.createElement('div');
                notchElement.className = 'smartphone-notch';
                document.querySelector('.smartphone-screen').prepend(notchElement);
            }
            if (!homeButton) {
                const homeButtonElement = document.createElement('div');
                homeButtonElement.className = 'home-button';
                smartphoneFrame.appendChild(homeButtonElement);
            }
        } else {
            // Remove notch and home button for non-iPhone models
            if (notch) notch.remove();
            if (homeButton) homeButton.remove();
        }
    }

    // Update phone color
    function updatePhoneColor() {
        const color = phoneColor.value;
        const smartphoneFrame = document.querySelector('.smartphone-frame');

        // Remove any existing color classes
        smartphoneFrame.classList.remove('black', 'white', 'gold', 'silver', 'blue');

        // Add selected color class
        smartphoneFrame.classList.add(color);
    }

    // Update tablet model
    function updateTabletModel() {
        const model = tabletModel.value;
        const tabletFrame = document.querySelector('.tablet-frame');

        // Remove any existing model classes
        tabletFrame.classList.remove('ipad', 'ipad-pro', 'surface', 'galaxy-tab');

        // Add selected model class
        tabletFrame.classList.add(model);

        // Add/remove home button and camera based on model
        const homeButton = tabletFrame.querySelector('.home-button');
        const camera = tabletFrame.querySelector('.tablet-camera');

        // Remove existing elements first
        if (homeButton) homeButton.remove();
        if (camera) camera.remove();

        // Add model-specific elements
        if (model === 'ipad' || model === 'ipad-pro') {
            // Add home button for iPad models
            const homeButtonElement = document.createElement('div');
            homeButtonElement.className = 'home-button';
            tabletFrame.appendChild(homeButtonElement);

            // Add camera
            const cameraElement = document.createElement('div');
            cameraElement.className = 'tablet-camera';
            tabletFrame.appendChild(cameraElement);
        } else if (model === 'surface') {
            // Add camera for Surface
            const cameraElement = document.createElement('div');
            cameraElement.className = 'tablet-camera';
            tabletFrame.appendChild(cameraElement);
        }
    }

    // Update tablet orientation
    function updateTabletOrientation() {
        const orientation = tabletOrientation.value;
        const tabletFrame = document.querySelector('.tablet-frame');

        // Remove existing orientation classes
        tabletFrame.classList.remove('landscape', 'portrait');

        // Add selected orientation class
        tabletFrame.classList.add(orientation);
    }

    // Update tablet color
    function updateTabletColor() {
        const color = tabletColor.value;
        const tabletFrame = document.querySelector('.tablet-frame');

        // Remove any existing color classes
        tabletFrame.classList.remove('black', 'white', 'gold', 'silver', 'blue');

        // Add selected color class
        tabletFrame.classList.add(color);
    }

    // Update status bar style
    function updateStatusBarStyle() {
        const style = statusBarStyle.value;
        const statusBar = document.querySelector('.smartphone-status-bar');

        statusBar.classList.remove('status-bar-light', 'status-bar-dark');
        statusBar.classList.add('status-bar-' + style);
    }

    // Update tablet status bar style
    function updateTabletStatusBarStyle() {
        const style = tabletStatusBarStyle.value;
        const statusBar = document.querySelector('.tablet-status-bar');

        statusBar.classList.remove('status-bar-light', 'status-bar-dark');
        statusBar.classList.add('status-bar-' + style);
    }

    // Toggle status bar elements
    function toggleStatusBarElements() {
        const batteryElement = document.querySelector('.status-battery');
        const wifiElement = document.querySelector('.status-wifi');
        const signalElement = document.querySelector('.status-signal');
        const timeElement = document.querySelector('.status-time');

        batteryElement.style.display = showBattery.checked ? 'block' : 'none';
        wifiElement.style.display = showWifi.checked ? 'block' : 'none';
        signalElement.style.display = showSignal.checked ? 'block' : 'none';
        timeElement.style.display = showTime.checked ? 'block' : 'none';
    }

    // Toggle tablet status bar elements
    function toggleTabletStatusBarElements() {
        const batteryElement = document.querySelector('.tablet-status-battery');
        const wifiElement = document.querySelector('.tablet-status-wifi');
        const timeElement = document.querySelector('.tablet-status-time');

        batteryElement.style.display = tabletShowBattery.checked ? 'block' : 'none';
        wifiElement.style.display = tabletShowWifi.checked ? 'block' : 'none';
        timeElement.style.display = tabletShowTime.checked ? 'block' : 'none';
    }

    // Insert text content into terminal
    function insertTextContent() {
        try {
            // Get text
            var text = customText.value || "";

            // Check if empty
            if (!text.trim()) {
                return;
            }

            // Clear terminal with old-school method
            while (terminalOutput.firstChild) {
                terminalOutput.removeChild(terminalOutput.firstChild);
            }

            // Create text container
            var textDiv = document.createElement("div");
            textDiv.className = "command";

            // Insert text with simple method
            // Compatible with older browsers
            var lines = text.split("\n");
            for (var i = 0; i < lines.length; i++) {
                // Add text for this line
                var textNode = document.createTextNode(lines[i]);
                textDiv.appendChild(textNode);

                // Add line break (except for last line)
                if (i < lines.length - 1) {
                    var br = document.createElement("br");
                    textDiv.appendChild(br);
                }
            }

            // Add to terminal
            terminalOutput.appendChild(textDiv);

            console.log("Text successfully inserted");
        } catch (error) {
            // Error fallback: Direct insertion
            console.error("Error inserting text:", error);
            try {
                terminalOutput.innerHTML = "<div class='command'>" +
                    text.replace(/\n/g, "<br>").replace(/</g, "&lt;").replace(/>/g, "&gt;") +
                    "</div>";
            } catch (e) {
                console.error("Fallback also failed:", e);
            }
        }
    }

    // Enhanced insertImageContent function for terminal mockup
    function insertImageContent() {
        const file = imageUpload.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            // Clear previous content
            terminalOutput.innerHTML = '';

            const imageContainer = document.createElement('div');
            imageContainer.className = 'terminal-image';
            imageContainer.style.width = '100%';
            if (imageCenter.checked) {
                imageContainer.style.textAlign = 'center';
            }

            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.objectFit = 'contain';

            // Add onload handler to ensure image is properly loaded before display
            img.onload = function () {
                console.log("Terminal image loaded with dimensions:", img.naturalWidth, "x", img.naturalHeight);
            };

            imageContainer.appendChild(img);
            terminalOutput.appendChild(imageContainer);
        };
        reader.readAsDataURL(file);
    }

    // Insert ASCII art into terminal
    function insertAsciiArt() {
        const selectedArt = asciiSelection.value;
        const artText = asciiArt[selectedArt] || '';

        const artDiv = document.createElement('div');
        artDiv.className = 'ascii-art';
        artDiv.textContent = artText;
        terminalOutput.appendChild(artDiv);
    }

    // Enhanced insertScreenshot function for smartphone mockup
    function insertScreenshot() {
        const file = screenshotUpload.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            smartphoneContent.innerHTML = '';

            // Create a container to properly center and size the image
            const imgContainer = document.createElement('div');
            imgContainer.style.width = '100%';
            imgContainer.style.height = '100%';
            imgContainer.style.display = 'flex';
            imgContainer.style.alignItems = 'center';
            imgContainer.style.justifyContent = 'center';

            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.style.objectFit = 'contain';
            img.style.display = 'block';

            // Add onload handler to ensure image is properly loaded
            img.onload = function () {
                console.log("Smartphone image loaded with dimensions:", img.naturalWidth, "x", img.naturalHeight);
            };

            imgContainer.appendChild(img);
            smartphoneContent.appendChild(imgContainer);
        };
        reader.readAsDataURL(file);
    }

    // Insert app interface into smartphone
    function insertAppInterface() {
        smartphoneContent.innerHTML = '';

        const appHeader = document.createElement('div');
        appHeader.className = 'app-header';
        appHeader.textContent = appTitle.value || 'My App';

        const appContentDiv = document.createElement('div');
        appContentDiv.className = 'app-content';
        appContentDiv.innerHTML = appContent.value || '<p>App content goes here</p>';

        smartphoneContent.appendChild(appHeader);
        smartphoneContent.appendChild(appContentDiv);
    }

    // Insert browser interface into smartphone
    function insertBrowserInterface() {
        smartphoneContent.innerHTML = '';

        const browserBar = document.createElement('div');
        browserBar.className = 'browser-bar';

        const addressBar = document.createElement('div');
        addressBar.className = 'browser-address';
        addressBar.textContent = browserUrl.value || 'https://example.com';

        const browserContentDiv = document.createElement('div');
        browserContentDiv.className = 'browser-content';
        browserContentDiv.innerHTML = browserContent.value || '<p>Webpage content goes here</p>';

        browserBar.appendChild(addressBar);
        smartphoneContent.appendChild(browserBar);
        smartphoneContent.appendChild(browserContentDiv);
    }

    // Insert custom content into smartphone
    function insertCustomContent() {
        smartphoneContent.innerHTML = customScreenContent.value || '<p>Custom content goes here</p>';
    }

    // Enhanced insertTabletScreenshot function for tablet mockup
    function insertTabletScreenshot() {
        const file = tabletScreenshotUpload.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            tabletContent.innerHTML = '';

            // Create a container to properly center and size the image
            const imgContainer = document.createElement('div');
            imgContainer.style.width = '100%';
            imgContainer.style.height = '100%';
            imgContainer.style.display = 'flex';
            imgContainer.style.alignItems = 'center';
            imgContainer.style.justifyContent = 'center';

            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.style.objectFit = 'contain';
            img.style.display = 'block';

            // Add onload handler to ensure image is properly loaded
            img.onload = function () {
                console.log("Tablet image loaded with dimensions:", img.naturalWidth, "x", img.naturalHeight);
            };

            imgContainer.appendChild(img);
            tabletContent.appendChild(imgContainer);
        };
        reader.readAsDataURL(file);
    }

    // Insert app interface into tablet
    function insertTabletAppInterface() {
        tabletContent.innerHTML = '';

        const appHeader = document.createElement('div');
        appHeader.className = 'app-header';
        appHeader.textContent = tabletAppTitle.value || 'Tablet App';

        const appContentDiv = document.createElement('div');
        appContentDiv.className = 'app-content';
        appContentDiv.innerHTML = tabletAppContent.value || '<p>App content goes here</p>';

        tabletContent.appendChild(appHeader);
        tabletContent.appendChild(appContentDiv);
    }

    // Insert split view interface into tablet
    function insertTabletSplitView() {
        tabletContent.innerHTML = '';

        const splitRatio = tabletSplitRatio.value;

        const splitViewContainer = document.createElement('div');
        splitViewContainer.className = 'split-view-container ratio-' + splitRatio;

        // Left side
        const leftView = document.createElement('div');
        leftView.className = 'split-view-left';

        const leftHeader = document.createElement('div');
        leftHeader.className = 'app-header';
        leftHeader.textContent = tabletSplitviewLeftTitle.value || 'Left App';

        const leftContent = document.createElement('div');
        leftContent.className = 'app-content';
        leftContent.innerHTML = tabletSplitviewLeftContent.value || '<p>Left side content</p>';

        leftView.appendChild(leftHeader);
        leftView.appendChild(leftContent);

        // Divider
        const divider = document.createElement('div');
        divider.className = 'split-view-divider';

        // Right side
        const rightView = document.createElement('div');
        rightView.className = 'split-view-right';

        const rightHeader = document.createElement('div');
        rightHeader.className = 'app-header';
        rightHeader.textContent = tabletSplitviewRightTitle.value || 'Right App';

        const rightContent = document.createElement('div');
        rightContent.className = 'app-content';
        rightContent.innerHTML = tabletSplitviewRightContent.value || '<p>Right side content</p>';

        rightView.appendChild(rightHeader);
        rightView.appendChild(rightContent);

        // Add to container
        splitViewContainer.appendChild(leftView);
        splitViewContainer.appendChild(divider);
        splitViewContainer.appendChild(rightView);

        tabletContent.appendChild(splitViewContainer);
    }

    // Insert browser interface into tablet
    function insertTabletBrowserInterface() {
        tabletContent.innerHTML = '';

        const browserBar = document.createElement('div');
        browserBar.className = 'browser-bar';

        const addressBar = document.createElement('div');
        addressBar.className = 'browser-address';
        addressBar.textContent = tabletBrowserUrl.value || 'https://example.com';

        const browserContentDiv = document.createElement('div');
        browserContentDiv.className = 'browser-content';
        browserContentDiv.innerHTML = tabletBrowserContent.value || '<p>Webpage content goes here</p>';

        browserBar.appendChild(addressBar);
        tabletContent.appendChild(browserBar);
        tabletContent.appendChild(browserContentDiv);
    }

    // Insert custom content into tablet
    function insertTabletCustomContent() {
        tabletContent.innerHTML = tabletCustomScreenContent.value || '<p>Custom content goes here</p>';
    }

    // Update the mockup preview
    function updateMockup() {
        if (currentMockupType === 'terminal') {
            updateTerminalMockup();
        } else if (currentMockupType === 'smartphone') {
            updateSmartphoneMockup();
        } else if (currentMockupType === 'tablet') {
            updateTabletMockup();
        }
    }

    // Update terminal mockup
    function updateTerminalMockup() {
        // Update title and prompt
        displayTitle.textContent = terminalTitleInput.value;
        displayPrompt.textContent = promptInput.value;

        // Clear terminal output
        terminalOutput.innerHTML = '';

        // Handle different content types
        const contentType = contentTypeSelect.value;

        switch (contentType) {
            case 'text':
                insertTextContent();
                break;
            case 'image':
                insertImageContent();
                break;
            case 'ascii-art':
                insertAsciiArt();
                break;
        }
    }

    // Update smartphone mockup
    function updateSmartphoneMockup() {
        updatePhoneModel();
        updatePhoneColor();
        updateStatusBarStyle();
        toggleStatusBarElements();

        // Update smartphone time
        const timeElement = document.querySelector('.status-time');
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        timeElement.textContent = `${hours}:${minutes}`;

        // Apply custom background if enabled
        if (smartphoneUseCustomBg && smartphoneUseCustomBg.checked) {
            applySmartphoneCustomBgColor();
        }

        // Handle different content types
        const contentType = screenContentType.value;

        switch (contentType) {
            case 'screenshot':
                insertScreenshot();
                break;
            case 'app':
                insertAppInterface();
                break;
            case 'browser':
                insertBrowserInterface();
                break;
            case 'custom':
                insertCustomContent();
                break;
        }
    }

    // Update tablet mockup
    function updateTabletMockup() {
        updateTabletModel();
        updateTabletOrientation();
        updateTabletColor();
        updateTabletStatusBarStyle();
        toggleTabletStatusBarElements();

        // Update tablet time
        const timeElement = document.querySelector('.tablet-status-time');
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        timeElement.textContent = `${hours}:${minutes}`;

        // Apply custom background if enabled
        if (tabletUseCustomBg && tabletUseCustomBg.checked) {
            applyTabletCustomBgColor();
        }

        // Handle different content types
        const contentType = tabletContentType.value;

        switch (contentType) {
            case 'screenshot':
                insertTabletScreenshot();
                break;
            case 'app':
                insertTabletAppInterface();
                break;
            case 'splitview':
                insertTabletSplitView();
                break;
            case 'browser':
                insertTabletBrowserInterface();
                break;
            case 'custom':
                insertTabletCustomContent();
                break;
        }
    }

    // Download mockup as image
    function downloadMockup() {
        // Determine which mockup to download
        let targetElement;
        let filename;

        switch (currentMockupType) {
            case 'terminal':
                targetElement = mockupTerminal;
                filename = 'terminal-mockup.png';
                break;
            case 'smartphone':
                targetElement = mockupSmartphone;
                filename = 'smartphone-mockup.png';
                break;
            case 'tablet':
                targetElement = mockupTablet;
                filename = 'tablet-mockup.png';
                break;
        }

        // Use html2canvas to capture the mockup
        html2canvas(targetElement, {
            backgroundColor: null,
            scale: 2,  // Higher quality
            logging: false
        }).then(canvas => {
            // Create download link
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }

    // Initial setup
    toggleContentControls();
    toggleScreenContentControls();
    toggleTabletContentControls();
    updateMockup();

    initializeFixedPanel();
});