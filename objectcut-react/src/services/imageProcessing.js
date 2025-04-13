// Frontend image processing service
// Note: Heavy processing like AI background removal is delegated to the backend

// Process rectangle selection in browser
export const processRectangleSelection = async (imageUrl, coords) => {
    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            img.crossOrigin = 'Anonymous';

            img.onload = () => {
                // Create canvas for original image
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');

                // Draw original image
                ctx.drawImage(img, 0, 0);

                // Create transparent canvas for result
                const resultCanvas = document.createElement('canvas');
                resultCanvas.width = img.width;
                resultCanvas.height = img.height;
                const resultCtx = resultCanvas.getContext('2d');

                // Convert selection coordinates to image scale
                const { x1, y1, x2, y2 } = coords;

                // Create and apply the mask
                resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);

                // Draw only the selected area
                resultCtx.drawImage(
                    img,
                    x1, y1, x2 - x1, y2 - y1,   // Source rectangle
                    x1, y1, x2 - x1, y2 - y1    // Destination rectangle
                );

                // Create alpha mask
                const imageData = resultCtx.getImageData(0, 0, resultCanvas.width, resultCanvas.height);
                const data = imageData.data;

                // Apply alpha channel - transparent outside selection
                for (let i = 0; i < data.length; i += 4) {
                    const x = (i / 4) % resultCanvas.width;
                    const y = Math.floor((i / 4) / resultCanvas.width);

                    // Set alpha to 0 for pixels outside selection
                    if (x < x1 || x >= x2 || y < y1 || y >= y2) {
                        data[i + 3] = 0; // Alpha channel
                    }
                }

                resultCtx.putImageData(imageData, 0, 0);

                // Convert result to data URL
                const dataUrl = resultCanvas.toDataURL('image/png');
                resolve(dataUrl);
            };

            img.onerror = () => {
                reject(new Error('Failed to load image for processing'));
            };

            img.src = imageUrl;
        } catch (error) {
            reject(error);
        }
    });
};

// This function is a placeholder since the actual removal is done server-side
export const removeBackground = async (imageUrl) => {
    try {
        // Convert image URL to blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        // Create form data
        const formData = new FormData();
        formData.append('image', blob);

        // Send to server
        const serverResponse = await fetch('/api/remove-background', {
            method: 'POST',
            body: formData
        });

        if (!serverResponse.ok) {
            throw new Error(`Server responded with status: ${serverResponse.status}`);
        }

        // Get result as blob and convert to object URL
        const resultBlob = await serverResponse.blob();
        return URL.createObjectURL(resultBlob);
    } catch (error) {
        console.error('Background removal error:', error);
        throw error;
    }
};