import { useEffect, useCallback, useState, useRef } from 'react';
import type { UseSignalingBridgeOptions } from '../../types';

/**
 * useSignalingBridge - Bridges socket signaling with WebRTC
 * 
 * Handles all WebRTC signaling events (offer/answer/ice-candidate)
 * that flow between the socket and peer connections.
 */
export function useSignalingBridge({
    socket,
    roomId,
    getLocalStream,
    createPeerConnection,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
}: UseSignalingBridgeOptions) {
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');

    // Use ref for roomId to avoid stale closures in event handlers
    const roomIdRef = useRef(roomId);
    useEffect(() => {
        roomIdRef.current = roomId;
    }, [roomId]);

    // Helper to create ICE candidate handler
    const createIceCandidateHandler = useCallback((targetId: string) => {
        return (candidate: RTCIceCandidate) => {
            if (roomIdRef.current) sendIceCandidate(candidate.toJSON(), targetId, roomIdRef.current);
        };
    }, [sendIceCandidate]);

    // When we join a room, create offers to existing users
    // IMPORTANT: Register listener without roomId dependency to avoid missing events
    useEffect(() => {
        if (!socket) return;

        const handleRoomUsers = (users: { id: string; username: string }[]) => {
            // Get roomId from ref (always up-to-date)
            const currentRoomId = roomIdRef.current;
            console.log('[SignalingBridge] room-users received:', users.length, 'users, roomId:', currentRoomId);

            if (!currentRoomId) {
                console.warn('[SignalingBridge] No roomId yet, skipping peer connections');
                return;
            }

            users.forEach(user => {
                console.log('[SignalingBridge] Creating offer for:', user.username);
                setTimeout(() => {
                    const localStream = getLocalStream();
                    console.log('[SignalingBridge] Local stream:', localStream ? 'exists' : 'NULL');

                    const pc = createPeerConnection(
                        user.id,
                        user.username,
                        localStream,
                        createIceCandidateHandler(user.id)
                    );
                    pc.createOffer().then(offer => {
                        pc.setLocalDescription(offer);
                        sendOffer(offer, user.id, currentRoomId);
                        console.log('[SignalingBridge] Offer sent to:', user.username);
                    });
                }, 100);
            });
        };

        socket.on('room-users', handleRoomUsers);
        return () => { socket.off('room-users', handleRoomUsers); };
    }, [socket, createPeerConnection, sendOffer, getLocalStream, createIceCandidateHandler]);

    // Handle incoming offers
    useEffect(() => {
        if (!socket) return;

        const onOffer = async ({ offer, senderId, senderName }: {
            offer: RTCSessionDescriptionInit;
            senderId: string;
            senderName: string;
        }) => {
            const currentRoomId = roomIdRef.current;
            console.log('[SignalingBridge] Offer received from:', senderName, 'roomId:', currentRoomId);

            if (!currentRoomId) {
                console.warn('[SignalingBridge] No roomId, ignoring offer');
                return;
            }

            const answer = await handleOffer(
                offer, senderId, senderName,
                getLocalStream(),
                createIceCandidateHandler(senderId)
            );
            if (answer) {
                sendAnswer(answer, senderId, currentRoomId);
                setConnectionStatus('Connected');
            }
        };

        socket.on('offer', onOffer);
        return () => { socket.off('offer', onOffer); };
    }, [socket, handleOffer, sendAnswer, getLocalStream, createIceCandidateHandler]);

    // Handle incoming answers
    useEffect(() => {
        if (!socket) return;

        const onAnswer = async ({ answer, senderId }: {
            answer: RTCSessionDescriptionInit;
            senderId: string;
        }) => {
            await handleAnswer(answer, senderId);
            setConnectionStatus('Connected');
        };

        socket.on('answer', onAnswer);
        return () => { socket.off('answer', onAnswer); };
    }, [socket, handleAnswer]);

    // Handle incoming ICE candidates
    useEffect(() => {
        if (!socket) return;

        const onIceCandidate = ({ candidate, senderId }: {
            candidate: RTCIceCandidateInit;
            senderId: string;
        }) => {
            handleIceCandidate(candidate, senderId);
        };

        socket.on('ice-candidate', onIceCandidate);
        return () => { socket.off('ice-candidate', onIceCandidate); };
    }, [socket, handleIceCandidate]);

    const resetConnectionStatus = useCallback(() => {
        setConnectionStatus('Disconnected');
    }, []);

    return { connectionStatus, resetConnectionStatus };
}
