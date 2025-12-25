import { useEffect, useCallback, useState } from 'react';
import type { RemoteCaption, UseCaptionsOptions } from '../../types';
import { CAPTION_DISPLAY_DURATION } from '../../constants';

/**
 * useCaptions - Manages live caption sending and receiving
 * 
 * Combines speech recognition with socket caption sharing.
 */
export function useCaptions({
    roomId, username, transcript, interimTranscript,
    startListening, stopListening, sendCaption, addTranscriptEntry,
}: UseCaptionsOptions) {
    const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(false);
    const [remoteCaptions, setRemoteCaptions] = useState<RemoteCaption | null>(null);

    // Send captions when we speak
    useEffect(() => {
        if (!isCaptionsEnabled || !roomId) return;
        const captionText = transcript + interimTranscript;
        if (captionText.trim()) sendCaption(captionText, roomId, username);
    }, [transcript, interimTranscript, isCaptionsEnabled, roomId, username, sendCaption]);

    // Record our own transcript
    useEffect(() => {
        if (isCaptionsEnabled && transcript && roomId) {
            addTranscriptEntry(username, transcript);
        }
    }, [transcript, isCaptionsEnabled, roomId, username, addTranscriptEntry]);

    // Record remote captions
    useEffect(() => {
        if (remoteCaptions && roomId) {
            addTranscriptEntry(remoteCaptions.sender, remoteCaptions.text);
        }
    }, [remoteCaptions, roomId, addTranscriptEntry]);

    // Handle incoming remote caption
    const handleRemoteCaption = useCallback(({ caption, sender }: { caption: string; sender: string }) => {
        setRemoteCaptions({ text: caption, sender });
        setTimeout(() => setRemoteCaptions(null), CAPTION_DISPLAY_DURATION);
    }, []);

    // Toggle captions on/off
    const toggleCaptions = useCallback(() => {
        if (isCaptionsEnabled) {
            stopListening();
            setIsCaptionsEnabled(false);
        } else {
            startListening();
            setIsCaptionsEnabled(true);
        }
    }, [isCaptionsEnabled, startListening, stopListening]);

    return { isCaptionsEnabled, remoteCaptions, toggleCaptions, handleRemoteCaption };
}
