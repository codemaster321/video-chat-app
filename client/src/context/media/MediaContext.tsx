import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useMediaStream, useVirtualBackground } from "../../hooks/media";
import type { BackgroundMode } from "../../hooks/media";

// ============ TYPES ============
interface MediaContextType {
    // Video/Audio
    localVideoRef: React.RefObject<HTMLVideoElement | null>;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    toggleVideo: () => void;
    toggleAudio: () => void;

    // Loading states
    isMediaLoading: boolean;
    isVirtualBgLoading: boolean;

    // Stream access
    getLocalStream: () => MediaStream | null;
    getEffectiveStream: () => MediaStream | null; // Returns canvas stream if virtual bg enabled

    // Virtual Background
    isVirtualBgEnabled: boolean;
    virtualBgMode: BackgroundMode;
    virtualBgCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    handleSelectBackground: (mode: BackgroundMode) => void;
    setBackgroundImageFile: (file: File) => void;
    setBackgroundImageUrl: (url: string) => void;

    // Screen share
    handleStartCapture: () => void;

    // Track replacement (for WebRTC)
    getVideoTrack: () => MediaStreamTrack | undefined;

    // Reassign stream to video ref
    reassignStream: () => void;
}

const MediaContext = createContext<MediaContextType | null>(null);

export function useMediaContext() {
    const context = useContext(MediaContext);
    if (!context) {
        throw new Error("useMediaContext must be used within MediaProvider");
    }
    return context;
}

// External setter for replaceVideoTrack (set by CallProvider)
let externalReplaceVideoTrack: ((track: MediaStreamTrack) => void) | null = null;

export function setReplaceVideoTrackFn(fn: (track: MediaStreamTrack) => void) {
    externalReplaceVideoTrack = fn;
}

export function MediaProvider({ children }: { children: React.ReactNode }) {
    const [isMediaLoading, setIsMediaLoading] = useState(true);

    const {
        localVideoRef, isVideoEnabled, isAudioEnabled,
        init: initMedia, toggleVideo, toggleAudio, startScreenShare, getVideoTrack, getLocalStream, reassignStream
    } = useMediaStream();

    const {
        isEnabled: isVirtualBgEnabled, isLoading: isVirtualBgLoading, mode: virtualBgMode,
        canvasRef: virtualBgCanvasRef, startVirtualBackground, stopVirtualBackground,
        setBackgroundImageFile, setBackgroundImageUrl, getCanvasStream
    } = useVirtualBackground();

    // Initialize media on mount
    useEffect(() => {
        const initialize = async () => {
            setIsMediaLoading(true);
            await initMedia();
            setIsMediaLoading(false);
        };
        initialize();
    }, [initMedia]);


    // Screen share
    const handleStartCapture = useCallback(async () => {
        const onEnded = () => {
            const camTrack = getVideoTrack();
            if (camTrack && externalReplaceVideoTrack) externalReplaceVideoTrack(camTrack);
        };
        const screenTrack = await startScreenShare(onEnded);
        if (screenTrack && externalReplaceVideoTrack) {
            externalReplaceVideoTrack(screenTrack);
        }
    }, [startScreenShare, getVideoTrack]);

    // Virtual background selection
    const handleSelectBackground = useCallback(async (mode: BackgroundMode) => {
        console.log('[VirtualBg] handleSelectBackground called with mode:', mode);
        if (mode === 'none') {
            stopVirtualBackground();
            const camTrack = getVideoTrack();
            if (camTrack && externalReplaceVideoTrack) externalReplaceVideoTrack(camTrack);
        } else {
            const stream = getLocalStream();
            console.log('[VirtualBg] Local stream:', stream ? 'exists' : 'NULL');
            if (stream) {
                await startVirtualBackground(stream, mode);
                setTimeout(() => {
                    const canvasStream = getCanvasStream();
                    console.log('[VirtualBg] Canvas stream:', canvasStream ? 'exists' : 'NULL');
                    if (canvasStream && externalReplaceVideoTrack) {
                        const track = canvasStream.getVideoTracks()[0];
                        externalReplaceVideoTrack(track);
                        console.log('[VirtualBg] Applied virtual background track');
                    }
                }, 200);
            }
        }
    }, [getLocalStream, startVirtualBackground, stopVirtualBackground, getVideoTrack, getCanvasStream]);

    // Get effective stream (canvas if virtual bg, otherwise camera)
    const getEffectiveStream = useCallback(() => {
        if (isVirtualBgEnabled) {
            const canvasStream = getCanvasStream();
            if (canvasStream) return canvasStream;
        }
        return getLocalStream();
    }, [isVirtualBgEnabled, getCanvasStream, getLocalStream]);

    const value: MediaContextType = {
        localVideoRef, isVideoEnabled, isAudioEnabled, toggleVideo, toggleAudio,
        isMediaLoading, isVirtualBgLoading,
        getLocalStream, getEffectiveStream,
        isVirtualBgEnabled, virtualBgMode, virtualBgCanvasRef,
        handleSelectBackground, setBackgroundImageFile, setBackgroundImageUrl,
        handleStartCapture, getVideoTrack,
        reassignStream,
    };

    return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
}
