import React, { useRef } from 'react';
import '../styles/Controls.css';

const Controls = ({
                      onLoadImage,
                      extractionMethod,
                      onExtractionMethodChange,
                      onExtract,
                      onSave,
                      canExtract,
                      canSave,
                      isProcessing
                  }) => {
    const fileInputRef = useRef(null);

    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
                onLoadImage(event.target.result);
            };

            reader.readAsDataURL(file);
        }
    };

    const handleLoadImageClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="controls">
            <div className="controls-top">
                <button
                    className="control-button"
                    onClick={handleLoadImageClick}
                    disabled={isProcessing}
                >
                    Load Image
                </button>

                <select
                    className="extraction-method"
                    value={extractionMethod}
                    onChange={(e) => onExtractionMethodChange(e.target.value)}
                    disabled={isProcessing}
                >
                    <option value="AI Background Removal">AI Background Removal</option>
                    <option value="Rectangle Selection">Rectangle Selection</option>
                </select>
            </div>

            <div className="controls-bottom">
                <button
                    className="control-button"
                    onClick={onExtract}
                    disabled={!canExtract || isProcessing}
                >
                    {isProcessing ? 'Processing...' : 'Extract Object'}
                </button>

                <button
                    className="control-button"
                    onClick={onSave}
                    disabled={!canSave || isProcessing}
                >
                    Save PNG
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".png,.jpg,.jpeg,.bmp"
                onChange={handleFileInputChange}
            />
        </div>
    );
};

export default Controls;