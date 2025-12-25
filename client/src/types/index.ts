// Shared types for the video call app

export interface Participant {
    id: string;
    username: string;
    stream?: MediaStream;
}

export interface ChatMessage {
    message: string;
    sender: string;
    senderId: string;
    timestamp: number;
    isOwn?: boolean;
}

export interface RemoteCaption {
    text: string;
    sender: string;
}

// Web Speech API Types
export interface SpeechRecognitionType extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: ((event: SpeechRecognitionEventType) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEventType) => void) | null;
    onend: (() => void) | null;
}

export interface SpeechRecognitionEventType {
    resultIndex: number;
    results: SpeechRecognitionResultListType;
}

export interface SpeechRecognitionResultListType {
    length: number;
    [index: number]: SpeechRecognitionResultType;
}

export interface SpeechRecognitionResultType {
    isFinal: boolean;
    [index: number]: { transcript: string; confidence: number };
}

export interface SpeechRecognitionErrorEventType {
    error: string;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognitionType;
        webkitSpeechRecognition: new () => SpeechRecognitionType;
    }
}


export interface UseSpeechRecognitionOptions {
    continuous?: boolean;
    interimResults?: boolean;
    lang?: string;
    autoClearMs?: number;
}

export interface UseSpeechRecognitionReturn {
    transcript: string;
    interimTranscript: string;
    isListening: boolean;
    isSupported: boolean;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
}

// ============ Hook Option Types ============
// These describe what data each hook needs to work


import type { Socket } from 'socket.io-client';

/** Options for useSignalingBridge - bridges socket events with WebRTC */
export interface UseSignalingBridgeOptions {
    socket: Socket | null;
    roomId: string | null;
    getLocalStream: () => MediaStream | null;
    createPeerConnection: (
        targetId: string,
        targetName: string,
        localStream: MediaStream | null,
        onIceCandidate: (candidate: RTCIceCandidate, targetId: string) => void
    ) => RTCPeerConnection;
    handleOffer: (
        offer: RTCSessionDescriptionInit,
        senderId: string,
        senderName: string,
        localStream: MediaStream | null,
        onIceCandidate: (candidate: RTCIceCandidate, targetId: string) => void
    ) => Promise<RTCSessionDescriptionInit | null>;
    handleAnswer: (answer: RTCSessionDescriptionInit, senderId: string) => Promise<void>;
    handleIceCandidate: (candidate: RTCIceCandidateInit, senderId: string) => void;
    sendOffer: (offer: RTCSessionDescriptionInit, targetId: string, room: string) => void;
    sendAnswer: (answer: RTCSessionDescriptionInit, targetId: string, room: string) => void;
    sendIceCandidate: (candidate: RTCIceCandidateInit, targetId: string, room: string) => void;
}

/** Options for useCaptions - manages live caption sending/receiving */
export interface UseCaptionsOptions {
    roomId: string | null;
    username: string;
    transcript: string;
    interimTranscript: string;
    startListening: () => void;
    stopListening: () => void;
    sendCaption: (caption: string, room: string, sender: string) => void;
    addTranscriptEntry: (speaker: string, text: string) => void;
}


export interface CallStateContextType {
    // Room
    roomId: string | null;
    connectionStatus: string;

    // Participants
    participants: Map<string, { id: string; username: string; stream?: MediaStream }>;

    // Call Actions
    handleMakeCall: () => void;
    handleJoinCall: () => void;
    handleHangup: () => void;
    handleStartNewCall: () => void;
    handleChatSubmit: (e: React.MouseEvent | React.KeyboardEvent) => void;
    copyRoomCode: () => void;

    // Captions
    isCaptionsEnabled: boolean;
    isSpeechSupported: boolean;
    toggleCaptions: () => void;
    remoteCaptions: RemoteCaption | null;
    transcript: string;
    interimTranscript: string;

    // Post-call
    showPostCall: boolean;
    callDuration: number;
    lastParticipantCount: number;
    meetingSummary: string | null;
    isSummaryLoading: boolean;
    summaryError: string | null;
    meetingTranscript: string;

    // Socket (for whiteboard)
    socket: any;
}

