import { useState, useCallback } from 'react';
import { SERVER_URL } from '../../constants';

/**
 * useMeetingSummary - Manages meeting summary generation
 * 
 * Handles the API call to generate summaries and modal state.
 */

interface UseMeetingSummaryReturn {
    isSummaryOpen: boolean;
    summary: string | null;
    isLoading: boolean;
    error: string | null;
    generateSummary: (transcript: string, participants: string[]) => Promise<void>;
    closeSummary: () => void;
}

export function useMeetingSummary(): UseMeetingSummaryReturn {
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateSummary = useCallback(async (transcript: string, participants: string[]) => {
        // Only generate if we have enough transcript
        if (transcript.trim().length <= 50) return;

        setIsSummaryOpen(true);
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${SERVER_URL}/api/summarize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript, participants }),
            });

            const data = await response.json();
            if (response.ok) {
                setSummary(data.summary);
            } else {
                setError(data.error || 'Failed to generate summary');
            }
        } catch {
            setError('Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const closeSummary = useCallback(() => {
        setIsSummaryOpen(false);
    }, []);

    return {
        isSummaryOpen,
        summary,
        isLoading,
        error,
        generateSummary,
        closeSummary,
    };
}
