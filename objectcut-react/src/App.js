import React, { useState, useRef } from 'react';
import './styles/App.css';
import ImageCanvas from './components/ImageCanvas';
import Controls from './components/Controls';
import Header from './components/Header';
import { processRectangleSelection, removeBackground } from './services/imageProcessing';

function App() {
    const [originalImage, setOriginalImage] = useState(null);
    const [displayedImage, setDisplayedImage] = useState(null);
    const [extractedImage, setExtractedImage] = useState(null);
    const [hasSelection, setHasSelection] = useState(false);
    const [selectionCoords, setSelectionCoords] = useState(null);
    const [extractionMethod, setExtractionMethod] = useState('AI Background Removal');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    const canvasRef = useRef(null);

    const handleImageLoad = (imageData) => {
        setOriginalImage(imageData);
        setDisplayedImage(imageData);
        setExtractedImage(null);
        setHasSelection(false);
        setSelectionCoords(null);
        setError(null);
    };

    const handleSelectionChange = (hasSelection, coords) => {
        setHasSelection(hasSelection);
        setSelectionCoords(coords);
    };

    const extractObject = async () => {
        if (!originalImage) return;

        setIsProcessing(true);
        setError(null);

        try {
            if (extractionMethod === 'Rectangle Selection') {
                if (!hasSelection || !selectionCoords) {
                    setError('Please select an area first');
                    setIsProcessing(false);
                    return;
                }

                const result = await processRectangleSelection(originalImage, selectionCoords);
                setExtractedImage(result);
                setDisplayedImage(result);
            } else if (extractionMethod === 'AI Background Removal') {
                // Convert image to format suitable for server
                const imageBlob = await fetch(originalImage).then(r => r.blob());
                const formData = new FormData();
                formData.append('image', imageBlob);

                // Send to server for processing
                const response = await fetch('/api/remove-background', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Background removal failed');

                const result = await response.blob();
                const resultUrl = URL.createObjectURL(result);

                setExtractedImage(resultUrl);
                setDisplayedImage(resultUrl);
            }
        } catch (err) {
            setError(`Error during extraction: ${err.message}`);
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const savePNG = () => {
        if (!extractedImage) return;

        const link = document.createElement('a');
        link.href = extractedImage;
        link.download = 'extracted-object.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="app">
            <Header />

            <Controls
                onLoadImage={handleImageLoad}
                extractionMethod={extractionMethod}
                onExtractionMethodChange={setExtractionMethod}
                onExtract={extractObject}
                onSave={savePNG}
                canExtract={!!originalImage}
                canSave={!!extractedImage}
                isProcessing={isProcessing}
            />

            <div className="canvas-container">
                {!originalImage && !displayedImage ? (
                    <div className="drop-hint">Drag & Drop Image Here</div>
                ) : (
                    <ImageCanvas
                        ref={canvasRef}
                        image={displayedImage}
                        onImageLoad={handleImageLoad}
                        onSelectionChange={handleSelectionChange}
                        selectionEnabled={extractionMethod === 'Rectangle Selection'}
                    />
                )}
            </div>

            {error && <div className="error-message">{error}</div>}
        </div>
    );
}

export default App;