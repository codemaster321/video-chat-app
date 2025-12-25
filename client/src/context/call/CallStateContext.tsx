import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

// Hooks from new folder structure
import { useSignaling, useWebRTC, useSignalingBridge } from "../../hooks/webrtc";

// Contexts from new folder structure
import { useMediaContext, setReplaceVideoTrackFn } from "../media";
import { useChatContext, useUIContext } from "../ui";
import { useSpeechContext, useTranscriptContext, useSummaryContext, useMeetingContext } from "../meeting";

import type { ChatMessage, CallStateContextType } from "../../types/index";
import { SERVER_URL } from "../../constants";


const CallStateContext = createContext<CallStateContextType | null>(null);

export function useCallStateContext() {
    const context = useContext(CallStateContext);
    if (!context) {
        throw new Error("useCallStateContext must be used within CallStateProvider");
    }
    return context;
}

export function CallStateProvider({ children }: { children: React.ReactNode }) {
    // Get other contexts
    const { getLocalStream } = useMediaContext();
    const { addMessage, clearMessages, chatMessage, setChatMessage } = useChatContext();
    const { username, roomInput, addNotification, setIsCopied } = useUIContext();

    // New focused contexts
    const { transcript, interimTranscript, isSupported: isSpeechSupported } = useSpeechContext();
    const { transcript: meetingTranscript, getFormattedTranscript, clearTranscript } = useTranscriptContext();
    const { summary: meetingSummary, isLoading: isSummaryLoading, error: summaryError, generateSummary, closeSummary } = useSummaryContext();

    // Meeting context (captions + post-call)
    const {
        isCaptionsEnabled, remoteCaptions, toggleCaptions, initCaptions, handleRemoteCaption,
        showPostCall, setShowPostCall, callDuration, setCallDuration, lastParticipantCount, setLastParticipantCount,
    } = useMeetingContext();

    // Room state
    const [roomId, setRoomId] = useState<string | null>(null);
    const [callStartTime, setCallStartTime] = useState<number | null>(null);

    // WebRTC hooks
    const {
        participants, createPeerConnection, handleOffer, handleAnswer,
        handleIceCandidate, addParticipant, removeParticipant, closeAllConnections, replaceVideoTrack
    } = useWebRTC();

    // Set replaceVideoTrack for MediaContext
    useEffect(() => {
        setReplaceVideoTrackFn(replaceVideoTrack);
    }, [replaceVideoTrack]);

    // Signaling events
    const signalingEvents = useMemo(() => ({
        onRoomUsers: (users: { id: string; username: string }[]) => {
            users.forEach(user => addParticipant(user.id, user.username));
        },
        onUserJoined: (user: { id: string; username: string }) => {
            addParticipant(user.id, user.username);
            addNotification(`${user.username} joined`);
        },
        onUserLeft: (user: { id: string; username: string }) => {
            removeParticipant(user.id);
            addNotification(`${user.username} left`);
        },
        onChatMessage: (msg: ChatMessage) => addMessage(msg),
        onReady: () => { },
        onError: (data: { message: string }) => {
            setRoomId(null);
            addNotification(`⚠️ ${data.message}`);
        },
    }), [addParticipant, removeParticipant, addNotification, addMessage]);

    const { socket, joinRoom, leaveRoom, sendOffer, sendAnswer, sendIceCandidate, sendChatMessage, sendCaption } =
        useSignaling(SERVER_URL, signalingEvents);

    const { connectionStatus, resetConnectionStatus } = useSignalingBridge({
        socket, roomId, getLocalStream,
        createPeerConnection, handleOffer, handleAnswer, handleIceCandidate,
        sendOffer, sendAnswer, sendIceCandidate,
    });

    // Initialize captions when roomId changes
    useEffect(() => {
        initCaptions(roomId, username, sendCaption);
    }, [roomId, username, sendCaption, initCaptions]);

    // Register caption handler
    useEffect(() => {
        if (!socket) return;
        socket.on('caption', handleRemoteCaption);
        return () => { socket.off('caption', handleRemoteCaption); };
    }, [socket, handleRemoteCaption]);

    // Call actions
    const handleMakeCall = useCallback(() => {
        const newRoomId = Math.random().toString(36).substring(2, 8);
        setRoomId(newRoomId);
        setCallStartTime(Date.now());
        setShowPostCall(false);
        joinRoom(newRoomId, username);
    }, [joinRoom, username, setShowPostCall]);

    const handleJoinCall = useCallback(() => {
        if (!roomInput.trim()) return;
        setRoomId(roomInput);
        setCallStartTime(Date.now());
        setShowPostCall(false);
        joinRoom(roomInput, username);
    }, [joinRoom, roomInput, username, setShowPostCall]);

    const handleHangup = useCallback(async () => {
        const duration = callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : 0;
        setCallDuration(duration);
        setLastParticipantCount(participants.size + 1);

        const fullTranscript = getFormattedTranscript();
        const participantNames = [username, ...Array.from(participants.values()).map(p => p.username)];

        setShowPostCall(true);
        generateSummary(fullTranscript, participantNames);

        // Notify server we're leaving (so other participants know immediately)
        if (roomId) leaveRoom(roomId);

        closeAllConnections();
        setRoomId(null);
        clearMessages();
        resetConnectionStatus();
    }, [callStartTime, participants, username, roomId, getFormattedTranscript, generateSummary, leaveRoom, closeAllConnections, resetConnectionStatus, clearMessages, setCallDuration, setLastParticipantCount, setShowPostCall]);

    const handleStartNewCall = useCallback(() => {
        setShowPostCall(false);
        closeSummary();
        clearTranscript();
    }, [closeSummary, clearTranscript, setShowPostCall]);

    // Chat submit
    const handleChatSubmit = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault();
        if (!chatMessage.trim() || !socket || !roomId) return;

        const msg: ChatMessage = {
            message: chatMessage,
            sender: username,
            senderId: socket.id ?? '',
            timestamp: Date.now(),
            isOwn: true,
        };

        addMessage(msg);
        sendChatMessage(chatMessage, roomId);
        setChatMessage("");
    }, [chatMessage, socket, roomId, username, sendChatMessage, addMessage, setChatMessage]);

    // Room code copy
    const copyRoomCode = useCallback(() => {
        if (roomId) {
            navigator.clipboard.writeText(roomId);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    }, [roomId, setIsCopied]);

    const value: CallStateContextType = {
        roomId, connectionStatus,
        participants,
        handleMakeCall, handleJoinCall, handleHangup, handleStartNewCall, handleChatSubmit, copyRoomCode,
        isCaptionsEnabled, isSpeechSupported, toggleCaptions, remoteCaptions, transcript, interimTranscript,
        showPostCall, callDuration, lastParticipantCount, meetingSummary, isSummaryLoading, summaryError, meetingTranscript,
        socket,
    };

    return <CallStateContext.Provider value={value}>{children}</CallStateContext.Provider>;
}
