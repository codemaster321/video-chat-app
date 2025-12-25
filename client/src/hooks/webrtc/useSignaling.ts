import { useRef, useCallback, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * useSignaling - Handles communication with the server
 * 
 * This hook manages Socket.io connection to send/receive messages.
 * Think of it as a "messenger" between you and other users.
 */

// What events can the server send us?
interface ServerEvents {
    onRoomUsers: (users: { id: string; username: string }[]) => void;
    onUserJoined: (user: { id: string; username: string }) => void;
    onUserLeft: (user: { id: string; username: string }) => void;
    onOffer: (data: { offer: RTCSessionDescriptionInit; senderId: string; senderName: string }) => void;
    onAnswer: (data: { answer: RTCSessionDescriptionInit; senderId: string }) => void;
    onIceCandidate: (data: { candidate: RTCIceCandidateInit; senderId: string }) => void;
    onChatMessage: (msg: { message: string; sender: string; senderId: string; timestamp: number }) => void;
    onCaption: (data: { caption: string; sender: string }) => void;
    onReady: () => void;
    onError: (data: { message: string; retryAfter?: number }) => void;
}

export function useSignaling(serverUrl: string, events: Partial<ServerEvents>) {
    // Store the socket connection
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Connect to server when hook is first used
    useEffect(() => {
        const socket = io(serverUrl);
        socketRef.current = socket;

        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));

        // Register all event handlers
        if (events.onRoomUsers) socket.on('room-users', events.onRoomUsers);
        if (events.onUserJoined) socket.on('user-joined', events.onUserJoined);
        if (events.onUserLeft) socket.on('user-left', events.onUserLeft);
        if (events.onOffer) socket.on('offer', events.onOffer);
        if (events.onAnswer) socket.on('answer', events.onAnswer);
        if (events.onIceCandidate) socket.on('ice-candidate', events.onIceCandidate);
        if (events.onChatMessage) socket.on('chat message', events.onChatMessage);
        if (events.onCaption) socket.on('caption', events.onCaption);
        if (events.onReady) socket.on('ready', events.onReady);
        if (events.onError) socket.on('error', events.onError);

        return () => { socket.disconnect(); };
    }, [serverUrl]);

    /**
     * Join a call room
     */
    const joinRoom = useCallback((roomId: string, username: string) => {
        socketRef.current?.emit('join-room', { roomId, username });
    }, []);

    /**
     * Leave the current room (notifies other participants)
     */
    const leaveRoom = useCallback((roomId: string) => {
        socketRef.current?.emit('leave-room', { roomId });
    }, []);

    /**
     * Send WebRTC offer to another user
     * (This is like saying "Hey, I want to connect with you")
     */
    const sendOffer = useCallback((offer: RTCSessionDescriptionInit, targetId: string, room: string) => {
        socketRef.current?.emit('offer', { offer, targetId, room });
    }, []);

    /**
     * Send WebRTC answer to another user
     * (This is like saying "OK, let's connect!")
     */
    const sendAnswer = useCallback((answer: RTCSessionDescriptionInit, targetId: string, room: string) => {
        socketRef.current?.emit('answer', { answer, targetId, room });
    }, []);

    /**
     * Send ICE candidate (network routing info)
     */
    const sendIceCandidate = useCallback((candidate: RTCIceCandidateInit, targetId: string, room: string) => {
        socketRef.current?.emit('ice-candidate', { candidate, targetId, room });
    }, []);

    /**
     * Send a chat message
     */
    const sendChatMessage = useCallback((message: string, room: string) => {
        socketRef.current?.emit('chat message', { message, room });
    }, []);

    /**
     * Send live caption text
     */
    const sendCaption = useCallback((caption: string, room: string, sender: string) => {
        socketRef.current?.emit('caption', {
            room,
            caption,
            sender,
            senderId: socketRef.current?.id
        });
    }, []);

    return {
        socket: socketRef.current,
        isConnected,
        joinRoom,
        leaveRoom,
        sendOffer,
        sendAnswer,
        sendIceCandidate,
        sendChatMessage,
        sendCaption,
    };
}
