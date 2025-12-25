import React, { createContext, useContext } from "react";
import { useMeetingTranscript } from "../../hooks/meeting";

interface TranscriptContextType {
    transcript: string;
    addEntry: (speaker: string, text: string) => void;
    clearTranscript: () => void;
    getFormattedTranscript: () => string;
}

const TranscriptContext = createContext<TranscriptContextType | null>(null);

export function useTranscriptContext() {
    const context = useContext(TranscriptContext);
    if (!context) {
        throw new Error("useTranscriptContext must be used within TranscriptProvider");
    }
    return context;
}

export function TranscriptProvider({ children }: { children: React.ReactNode }) {
    const meetingTranscript = useMeetingTranscript();

    return (
        <TranscriptContext.Provider value={meetingTranscript}>
            {children}
        </TranscriptContext.Provider>
    );
}
