import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import '../styles/ImageCanvas.css';

const ImageCanvas = forwardRef(({
                                    image,
                                    onImageLoad,
                                    onSelectionChange,
                                    selectionEnabled = true
                                }, ref) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
    const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
    const [hasSelection, setHasSelection] = useState(false);
    const [canvasContext, setCanvasContext] = useState(null);
    const [imageObj, setImageObj] = useState(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [scale, setScale] = useState(1);

    // Expose canvas methods to parent
    useImperativeHandle(ref, () => ({
        getCanvasContext: () => canvasContext,
        getImageObject: () => imageObj,
        clearSelection: () => {
            setHasSelection(false);
            setSelectionStart({ x: 0, y: 0 });
            setSelectionEnd({ x: 0, y: 0 });
            drawImage();
        },
        getSelectionCoordinates: () => {
            if (!hasSelection || !imageObj) return null;

            // Calculate image position on canvas
            const imgWidth = imageObj.width * scale;
            const imgHeight = imageObj.height * scale;
            const imgX = (canvasSize.width - imgWidth) / 2;
            const imgY = (canvasSize.height - imgHeight) / 2;

            // Convert canvas coordinates to image coordinates
            let x1 = Math.max(0, Math.min((selectionStart.x - imgX) / scale, imageObj.width - 1));
            let y1 = Math.max(0, Math.min((selectionStart.y - imgY) / scale, imageObj.height - 1));
            let x2 = Math.max(0, Math.min((selectionEnd.x - imgX) / scale, imageObj.width - 1));
            let y2 = Math.max(0, Math.min((selectionEnd.y - imgY) / scale, imageObj.height - 1));

            // Sort coordinates
            [x1, x2] = [Math.min(x1, x2), Math.max(x1, x2)];
            [y1, y2] = [Math.min(y1, y2), Math.max(y1, y2)];

            return { x1: Math.round(x1), y1: Math.round(y1), x2: Math.round(x2), y2: Math.round(y2) };
        }
    }));

    // Initialize canvas
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        setCanvasContext(ctx);

        const updateCanvasSize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                canvas.width = clientWidth;
                canvas.height = clientHeight;
                setCanvasSize({ width: clientWidth, height: clientHeight });
            }
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);

        return () => {
            window.removeEventListener('resize', updateCanvasSize);
        };
    }, []);

    // Load and draw image when it changes
    useEffect(() => {
        if (!image || !canvasContext) return;

        const img = new Image();
        img.onload = () => {
            setImageObj(img);
            calculateScale(img);
        };
        img.src = image;

        return () => {
            img.onload = null;
        };
    }, [image, canvasContext]);

    // Calculate scale to fit image in canvas
    const calculateScale = (img) => {
        if (!img || !canvasSize.width || !canvasSize.height) return;

        const imgRatio = img.width / img.height;
        const canvasRatio = canvasSize.width / canvasSize.height;

        let newScale;
        if (imgRatio > canvasRatio) {
            newScale = (canvasSize.width - 40) / img.width;
        } else {
            newScale = (canvasSize.height - 40) / img.height;
        }

        setScale(newScale);
    };

    // Redraw image when scale or selection changes
    useEffect(() => {
        if (imageObj && scale > 0) {
            drawImage();
        }
    }, [imageObj, scale, selectionStart, selectionEnd, hasSelection, isSelecting]);

    // Draw image and selection
    const drawImage = () => {
        if (!canvasContext || !imageObj) return;

        const ctx = canvasContext;
        ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

        // Calculate image position to center it
        const imgWidth = imageObj.width * scale;
        const imgHeight = imageObj.height * scale;
        const imgX = (canvasSize.width - imgWidth) / 2;
        const imgY = (canvasSize.height - imgHeight) / 2;

        // Draw image
        ctx.drawImage(imageObj, imgX, imgY, imgWidth, imgHeight);

        // Draw selection rectangle if selecting or has selection
        if ((isSelecting || hasSelection) && selectionEnabled) {
            ctx.strokeStyle = '#56b4e9';
            ctx.lineWidth = 2;

            const x = Math.min(selectionStart.x, selectionEnd.x);
            const y = Math.min(selectionStart.y, selectionEnd.y);
            const width = Math.abs(selectionEnd.x - selectionStart.x);
            const height = Math.abs(selectionEnd.y - selectionStart.y);

            ctx.strokeRect(x, y, width, height);
        }
    };

    // Mouse event handlers
    const handleMouseDown = (e) => {
        if (!selectionEnabled || !imageObj) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setSelectionStart({ x, y });
        setSelectionEnd({ x, y });
        setIsSelecting(true);
        setHasSelection(false);
    };

    const handleMouseMove = (e) => {
        if (!isSelecting || !selectionEnabled) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setSelectionEnd({ x, y });
    };

    const handleMouseUp = () => {
        if (!isSelecting || !selectionEnabled) return;

        setIsSelecting(false);

        if (
            Math.abs(selectionEnd.x - selectionStart.x) > 5 &&
            Math.abs(selectionEnd.y - selectionStart.y) > 5
        ) {
            setHasSelection(true);

            // Notify parent component about selection
            if (onSelectionChange) {
                const coords = {
                    x1: Math.min(selectionStart.x, selectionEnd.x),
                    y1: Math.min(selectionStart.y, selectionEnd.y),
                    x2: Math.max(selectionStart.x, selectionEnd.x),
                    y2: Math.max(selectionStart.y, selectionEnd.y)
                };
                onSelectionChange(true, coords);
            }
        } else {
            setHasSelection(false);
            if (onSelectionChange) {
                onSelectionChange(false, null);
            }
        }
    };

    // Drag and drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp'];

            if (validTypes.includes(file.type)) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (onImageLoad) {
                        onImageLoad(event.target.result);
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    };

    return (
        <div
            className="image-canvas-container"
            ref={containerRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <canvas
                ref={canvasRef}
                className="image-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
        </div>
    );
});

export default ImageCanvas;