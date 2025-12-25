import React, { createContext, useContext } from "react";
import { useMeetingSummary } from "../../hooks/meeting";

interface SummaryContextType {
    summary: string | null;
    isLoading: boolean;
    error: string | null;
    generateSummary: (transcript: string, participants: string[]) => void;
    closeSummary: () => void;
}

const SummaryContext = createContext<SummaryContextType | null>(null);

export function useSummaryContext() {
    const context = useContext(SummaryContext);
    if (!context) {
        throw new Error("useSummaryContext must be used within SummaryProvider");
    }
    return context;
}

export function SummaryProvider({ children }: { children: React.ReactNode }) {
    const meetingSummary = useMeetingSummary();

    return (
        <SummaryContext.Provider value={meetingSummary}>
            {children}
        </SummaryContext.Provider>
    );
}
