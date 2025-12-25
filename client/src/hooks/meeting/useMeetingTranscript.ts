import { useRef, useCallback, useState } from 'react';

interface TranscriptEntry {
    speaker: string;
    text: string;
    timestamp: number;
}

interface UseMeetingTranscriptReturn {
    transcript: string;
    entries: TranscriptEntry[];
    addEntry: (speaker: string, text: string) => void;
    clearTranscript: () => void;
    getFormattedTranscript: () => string;
}

export function useMeetingTranscript(): UseMeetingTranscriptReturn {
    const [entries, setEntries] = useState<TranscriptEntry[]>([]);
    const lastSpeakerRef = useRef<string>('');
    const lastTextRef = useRef<string>('');

    const addEntry = useCallback((speaker: string, text: string) => {
        // Skip if same text as last entry (avoid duplicates)
        if (text === lastTextRef.current && speaker === lastSpeakerRef.current) return;
        if (!text.trim()) return;

        lastSpeakerRef.current = speaker;
        lastTextRef.current = text;

        setEntries(prev => [...prev, {
            speaker,
            text: text.trim(),
            timestamp: Date.now()
        }]);
    }, []);

    const clearTranscript = useCallback(() => {
        setEntries([]);
        lastSpeakerRef.current = '';
        lastTextRef.current = '';
    }, []);

    const getFormattedTranscript = useCallback(() => {
        return entries.map(e => `${e.speaker}: ${e.text}`).join('\n');
    }, [entries]);

    const transcript = entries.map(e => `${e.speaker}: ${e.text}`).join('\n');

    return { transcript, entries, addEntry, clearTranscript, getFormattedTranscript };
}
