import React, { createContext, useContext } from "react";
import { useSpeechRecognition } from "../../hooks/meeting";

interface SpeechContextType {
    transcript: string;
    interimTranscript: string;
    isSupported: boolean;
    startListening: () => void;
    stopListening: () => void;
}

const SpeechContext = createContext<SpeechContextType | null>(null);

export function useSpeechContext() {
    const context = useContext(SpeechContext);
    if (!context) {
        throw new Error("useSpeechContext must be used within SpeechProvider");
    }
    return context;
}

export function SpeechProvider({ children }: { children: React.ReactNode }) {
    const speechRecognition = useSpeechRecognition();

    return (
        <SpeechContext.Provider value={speechRecognition}>
            {children}
        </SpeechContext.Provider>
    );
}
