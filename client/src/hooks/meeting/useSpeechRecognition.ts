import { useState, useEffect, useCallback, useRef } from 'react';
import type { SpeechRecognitionType, SpeechRecognitionEventType, SpeechRecognitionErrorEventType, UseSpeechRecognitionOptions, UseSpeechRecognitionReturn } from '../../types';


export function useSpeechRecognition(
    options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
    const {
        continuous = true,
        interimResults = true,
        lang = 'en-US',
        autoClearMs = 4000,
    } = options;

    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognitionType | null>(null);
    const isListeningRef = useRef(false);
    const shouldRestartRef = useRef(false);
    const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const isSupported = typeof window !== 'undefined' &&
        (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);

    // Keep ref in sync with state
    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);

    // Helper to safely try starting recognition
    const tryStartRecognition = useCallback((recreateOnFail = false) => {
        if (!recognitionRef.current || !isListeningRef.current) return;

        try {
            recognitionRef.current.start();
        } catch {
            if (recreateOnFail && isSupported) {
                recognitionRef.current = createRecognitionInstance();
                try {
                    recognitionRef.current?.start();
                } catch { /* Failed to restart */ }
            }
        }
    }, [isSupported]);

    // Create recognition instance
    const createRecognitionInstance = useCallback((): SpeechRecognitionType | null => {
        if (!isSupported) return null;

        const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognitionClass();

        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.lang = lang;

        recognition.onresult = (event: SpeechRecognitionEventType) => {
            let finalTranscript = '';
            let currentInterim = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript + ' ';
                } else {
                    currentInterim += result[0].transcript;
                }
            }

            if (finalTranscript) {
                setTranscript(finalTranscript.trim());
                // Schedule auto-clear
                if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
                clearTimeoutRef.current = setTimeout(() => {
                    setTranscript('');
                    setInterimTranscript('');
                }, autoClearMs);
            }
            setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEventType) => {
            if (event.error === 'not-allowed' || event.error === 'audio-capture') {
                setIsListening(false);
                isListeningRef.current = false;
                shouldRestartRef.current = false;
            }
        };

        recognition.onend = () => {
            if (isListeningRef.current && document.visibilityState === 'visible') {
                setTimeout(() => tryStartRecognition(), 100);
            } else if (isListeningRef.current) {
                shouldRestartRef.current = true;
            }
        };

        return recognition;
    }, [isSupported, continuous, interimResults, lang, autoClearMs, tryStartRecognition]);

    // Initialize recognition
    useEffect(() => {
        recognitionRef.current = createRecognitionInstance();
        return () => {
            if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
            try { recognitionRef.current?.abort(); } catch { /* Ignore */ }
        };
    }, [createRecognitionInstance]);

    // Handle visibility/focus change - restart if needed
    useEffect(() => {
        const handleFocus = () => {
            if (shouldRestartRef.current && isListeningRef.current) {
                shouldRestartRef.current = false;
                setTimeout(() => tryStartRecognition(true), 200);
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [tryStartRecognition]);

    const startListening = useCallback(() => {
        if (!isSupported) return;

        recognitionRef.current = createRecognitionInstance();
        if (!recognitionRef.current) return;

        setTranscript('');
        setInterimTranscript('');
        setIsListening(true);
        isListeningRef.current = true;
        shouldRestartRef.current = false;

        try {
            recognitionRef.current.start();
        } catch (e) {
            console.error('Error starting:', e);
        }
    }, [isSupported, createRecognitionInstance]);

    const stopListening = useCallback(() => {
        setIsListening(false);
        isListeningRef.current = false;
        shouldRestartRef.current = false;

        if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
        try { recognitionRef.current?.stop(); } catch { /* Ignore */ }
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
    }, []);

    return {
        transcript,
        interimTranscript,
        isListening,
        isSupported,
        startListening,
        stopListening,
        resetTranscript,
    };
}
