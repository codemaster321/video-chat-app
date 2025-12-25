import { useRef, useState, useCallback } from 'react';

/**
 * useMediaStream - Manages your camera and microphone
 * 
 * This hook handles:
 * - Getting permission to use camera/mic
 * - Turning video on/off
 * - Turning audio on/off
 * - Screen sharing
 */
export function useMediaStream() {
    // Track if camera and mic are enabled
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);

    // Reference to the video element (where we show the camera feed)
    const localVideoRef = useRef<HTMLVideoElement>(null);

    // Reference to the actual camera stream
    const localStreamRef = useRef<MediaStream | null>(null);

    /**
     * Initialize camera and microphone
     * Called once when the app starts
     */
    const init = useCallback(async () => {
        try {
            // Ask browser for camera and mic permission
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            // Save the stream
            localStreamRef.current = stream;

            // Show the stream in the video element
            // If video ref is not ready yet, we'll assign later via reassignStream
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error('Could not access camera/mic:', error);
        }
    }, []);

    /**
     * Turn camera on/off
     */
    const toggleVideo = useCallback(() => {
        const videoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoEnabled(videoTrack.enabled);
        }
    }, []);

    /**
     * Turn microphone on/off
     */
    const toggleAudio = useCallback(() => {
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsAudioEnabled(audioTrack.enabled);
        }
    }, []);

    /**
     * Start screen sharing
     * @param onEnded - Function to call when user stops sharing
     */
    const startScreenShare = useCallback(async (onEnded: () => void) => {
        try {
            // Ask browser for screen share permission
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false,
            });

            const screenTrack = screenStream.getVideoTracks()[0];

            // Show screen in our video element
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = screenStream;
            }

            // When user stops sharing, go back to camera
            screenTrack.onended = async () => {
                if (localStreamRef.current && localVideoRef.current) {
                    localVideoRef.current.srcObject = localStreamRef.current;
                }
                onEnded();
            };

            return screenTrack;
        } catch (error) {
            console.error('Screen share failed:', error);
            return null;
        }
    }, []);

    /**
     * Reassign stream to video element
     * Called when switching between pre-call and in-call views
     */
    const reassignStream = useCallback(() => {
        if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
        }
    }, []);

    /**
     * Get the current video track (for WebRTC)
     */
    const getVideoTrack = useCallback(() => {
        return localStreamRef.current?.getVideoTracks()[0];
    }, []);

    /**
     * Get the local stream directly
     */
    const getLocalStream = useCallback(() => {
        return localStreamRef.current;
    }, []);

    // Return everything the component needs
    return {
        // State
        isVideoEnabled,
        isAudioEnabled,

        // Refs
        localVideoRef,

        // Functions
        init,
        toggleVideo,
        toggleAudio,
        startScreenShare,
        reassignStream,
        getVideoTrack,
        getLocalStream,
    };
}
