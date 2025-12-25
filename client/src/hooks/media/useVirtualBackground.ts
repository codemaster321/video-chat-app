import { useRef, useCallback, useState, useEffect } from 'react';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import '@tensorflow/tfjs-backend-webgl';

export type BackgroundMode = 'none' | 'blur' | 'image';

export function useVirtualBackground(blurAmount = 10) {
    const [isEnabled, setIsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<BackgroundMode>('none');

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const segmenter = useRef<bodySegmentation.BodySegmenter | null>(null);
    const video = useRef<HTMLVideoElement | null>(null);
    const frameId = useRef<number>(0);
    const bgImage = useRef<HTMLImageElement | null>(null);
    const canvasStream = useRef<MediaStream | null>(null);

    // Load background image from URL
    const setBackgroundImageUrl = useCallback((url: string) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { bgImage.current = img; };
        img.src = url;
    }, []);

    // Load background image from file
    const setBackgroundImageFile = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => { bgImage.current = img; };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }, []);

    // Get canvas stream for WebRTC
    const getCanvasStream = useCallback(() => canvasStream.current, []);

    // Main processing loop
    const processFrame = useCallback(async (currentMode: BackgroundMode) => {
        const canvas = canvasRef.current;
        const vid = video.current;
        const seg = segmenter.current;
        if (!canvas || !vid || !seg) return;

        try {
            const people = await seg.segmentPeople(vid);

            if (currentMode === 'blur') {
                await bodySegmentation.drawBokehEffect(canvas, vid, people, 0.5, blurAmount, 3, false);
            } else if (currentMode === 'image') {
                const ctx = canvas.getContext('2d')!;
                if (bgImage.current) ctx.drawImage(bgImage.current, 0, 0, canvas.width, canvas.height);
                else { ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, canvas.width, canvas.height); }

                if (people.length > 0) {
                    const mask = await bodySegmentation.toBinaryMask(people, { r: 0, g: 0, b: 0, a: 0 }, { r: 0, g: 0, b: 0, a: 255 });
                    const tmp = document.createElement('canvas');
                    tmp.width = canvas.width; tmp.height = canvas.height;
                    const tCtx = tmp.getContext('2d')!;
                    tCtx.drawImage(vid, 0, 0, tmp.width, tmp.height);
                    const imgData = tCtx.getImageData(0, 0, tmp.width, tmp.height);
                    for (let i = 3; i < mask.data.length; i += 4) if (mask.data[i] === 255) imgData.data[i] = 0;
                    tCtx.putImageData(imgData, 0, 0);
                    ctx.drawImage(tmp, 0, 0);
                }
            }
        } catch (e) { console.error('Frame error:', e); }

        frameId.current = requestAnimationFrame(() => processFrame(currentMode));
    }, [blurAmount]);

    // Start virtual background
    const start = useCallback(async (stream: MediaStream, newMode: BackgroundMode, imageUrl?: string) => {
        setIsLoading(true);
        if (imageUrl) setBackgroundImageUrl(imageUrl);

        // Create a hidden video element for processing
        if (!video.current) {
            video.current = document.createElement('video');
            video.current.muted = true;
            video.current.playsInline = true;
        }
        video.current.srcObject = stream;
        await video.current.play();

        // Wait for video to have dimensions
        await new Promise<void>(resolve => {
            if (video.current!.videoWidth > 0) {
                resolve();
            } else {
                video.current!.onloadedmetadata = () => resolve();
            }
        });

        if (!segmenter.current) {
            segmenter.current = await bodySegmentation.createSegmenter(
                bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
                { runtime: 'mediapipe', solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation', modelType: 'general' }
            );
        }

        // Create canvas dynamically if not already provided via ref
        let canvas = canvasRef.current;
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.style.display = 'none';
            document.body.appendChild(canvas);
            (canvasRef as React.MutableRefObject<HTMLCanvasElement>).current = canvas;
        }

        if (canvas && video.current) {
            canvas.width = video.current.videoWidth || 640;
            canvas.height = video.current.videoHeight || 480;
            // Capture canvas stream for WebRTC at 30fps
            canvasStream.current = canvas.captureStream(30);
            console.log('[VirtualBg] Created canvas stream:', canvasStream.current ? 'success' : 'failed');
        }

        cancelAnimationFrame(frameId.current);
        setMode(newMode);
        setIsEnabled(true);
        setIsLoading(false);

        setTimeout(() => processFrame(newMode), 50);
    }, [processFrame, setBackgroundImageUrl]);

    // Stop
    const stop = useCallback(() => {
        cancelAnimationFrame(frameId.current);
        canvasStream.current = null;
        setIsEnabled(false);
        setMode('none');
    }, []);

    useEffect(() => () => { cancelAnimationFrame(frameId.current); segmenter.current?.dispose(); }, []);

    return {
        isEnabled, isLoading, mode, canvasRef,
        startVirtualBackground: start,
        stopVirtualBackground: stop,
        setMode,
        setBackgroundImageUrl,
        setBackgroundImageFile,
        getCanvasStream
    };
}
