import React, { createContext, useContext, useState, useCallback } from "react";
import { useCaptions } from "../../hooks/meeting";
import { useSpeechContext } from "./SpeechContext";
import { useTranscriptContext } from "./TranscriptContext";
import type { RemoteCaption } from "../../types/index";

// ============ TYPES ============
interface MeetingContextType {
    // Captions
    isCaptionsEnabled: boolean;
    remoteCaptions: RemoteCaption | null;
    toggleCaptions: () => void;
    initCaptions: (roomId: string | null, username: string, sendCaption: (caption: string, room: string, sender: string) => void) => void;
    handleRemoteCaption: (data: { caption: string; sender: string; senderId: string }) => void;

    // Post-call state
    showPostCall: boolean;
    setShowPostCall: (show: boolean) => void;
    callDuration: number;
    setCallDuration: (duration: number) => void;
    lastParticipantCount: number;
    setLastParticipantCount: (count: number) => void;
}

const MeetingContext = createContext<MeetingContextType | null>(null);

export function useMeetingContext() {
    const context = useContext(MeetingContext);
    if (!context) {
        throw new Error("useMeetingContext must be used within MeetingProvider");
    }
    return context;
}

export function MeetingProvider({ children }: { children: React.ReactNode }) {
    // Get speech and transcript from their dedicated contexts
    const { transcript, interimTranscript, startListening, stopListening } = useSpeechContext();
    const { addEntry: addTranscriptEntry } = useTranscriptContext();

    // Post-call state
    const [showPostCall, setShowPostCall] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [lastParticipantCount, setLastParticipantCount] = useState(1);

    // Captions config (set externally via initCaptions)
    const [captionsConfig, setCaptionsConfig] = useState<{
        roomId: string | null;
        username: string;
        sendCaption: (caption: string, room: string, sender: string) => void;
    }>({
        roomId: null,
        username: "You",
        sendCaption: () => { },
    });

    // Captions (uses speech + transcript contexts internally)
    const {
        isCaptionsEnabled, remoteCaptions, toggleCaptions, handleRemoteCaption
    } = useCaptions({
        roomId: captionsConfig.roomId,
        username: captionsConfig.username,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        sendCaption: captionsConfig.sendCaption,
        addTranscriptEntry,
    });

    // Initialize captions with roomId, username, and sendCaption function
    const initCaptions = useCallback((
        roomId: string | null,
        username: string,
        sendCaption: (caption: string, room: string, sender: string) => void
    ) => {
        setCaptionsConfig({ roomId, username, sendCaption });
    }, []);

    const value: MeetingContextType = {
        // Captions
        isCaptionsEnabled, remoteCaptions, toggleCaptions, initCaptions, handleRemoteCaption,
        // Post-call
        showPostCall, setShowPostCall, callDuration, setCallDuration, lastParticipantCount, setLastParticipantCount,
    };

    return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>;
}
