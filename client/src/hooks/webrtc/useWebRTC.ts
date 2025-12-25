import { useRef, useCallback, useState } from 'react';
import { ICE_SERVERS } from '../../constants';

/**
 * useWebRTC - Manages peer-to-peer video connections
 * 
 * WebRTC allows browsers to talk DIRECTLY to each other.
 * This hook creates and manages those connections.
 * 
 * Connection Flow:
 * 1. User A creates an "offer" (invitation to connect)
 * 2. User A sends offer to User B via server
 * 3. User B receives offer and creates "answer"
 * 4. User B sends answer back to User A
 * 5. Both exchange ICE candidates (network info)
 * 6. Direct connection established!
 */

// Type for a participant in the call
interface Participant {
    id: string;
    username: string;
    stream?: MediaStream;
}

export function useWebRTC() {
    // All participants in the call (Map: id -> participant info)
    const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());

    // All peer connections (Map: id -> RTCPeerConnection)
    const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

    // ICE candidates waiting to be added (before connection is ready)
    const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

    /**
     * Add a participant to the list
     */
    const addParticipant = useCallback((id: string, username: string, stream?: MediaStream) => {
        setParticipants(prev => {
            const updated = new Map(prev);
            updated.set(id, { id, username, stream });
            return updated;
        });
    }, []);

    /**
     * Remove a participant
     */
    const removeParticipant = useCallback((id: string) => {
        // Close their connection
        peerConnectionsRef.current.get(id)?.close();
        peerConnectionsRef.current.delete(id);
        pendingCandidatesRef.current.delete(id);

        // Remove from list
        setParticipants(prev => {
            const updated = new Map(prev);
            updated.delete(id);
            return updated;
        });
    }, []);

    /**
     * Create a new peer connection to someone
     * 
     * @param targetId - Who we're connecting to
     * @param targetName - Their display name
     * @param localStream - Our video/audio to share
     * @param onIceCandidate - Called when we have network info to send
     */
    const createPeerConnection = useCallback((
        targetId: string,
        targetName: string,
        localStream: MediaStream | null,
        onIceCandidate: (candidate: RTCIceCandidate, targetId: string) => void
    ): RTCPeerConnection => {
        // Check if we already have a connection
        const existing = peerConnectionsRef.current.get(targetId);
        if (existing && existing.connectionState !== 'closed') {
            return existing;
        }

        // Create new peer connection
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        // Add our video/audio tracks to send
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }

        // When we receive their video/audio
        pc.ontrack = (event) => {
            console.log('[WebRTC] ontrack fired for:', targetId, 'streams:', event.streams.length);
            const theirStream = event.streams[0];
            if (theirStream) {
                console.log('[WebRTC] Setting stream for:', targetId, 'tracks:', theirStream.getTracks().length);
                // Update participant with their stream
                setParticipants(prev => {
                    const updated = new Map(prev);
                    const existing = updated.get(targetId);
                    updated.set(targetId, {
                        id: targetId,
                        username: existing?.username || targetName,
                        stream: theirStream
                    });
                    console.log('[WebRTC] Updated participants:', updated.size);
                    return updated;
                });
            }
        };

        // When we discover network info to share
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                onIceCandidate(event.candidate, targetId);
            }
        };

        // Monitor connection state
        pc.onconnectionstatechange = () => {
            console.log('[WebRTC] Connection state:', targetId, '->', pc.connectionState);
            if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                removeParticipant(targetId);
            }
        };

        // Save the connection
        peerConnectionsRef.current.set(targetId, pc);
        return pc;
    }, [removeParticipant]);

    /**
     * Handle an incoming offer (someone wants to connect to us)
     */
    const handleOffer = useCallback(async (
        offer: RTCSessionDescriptionInit,
        senderId: string,
        senderName: string,
        localStream: MediaStream | null,
        onIceCandidate: (candidate: RTCIceCandidate, targetId: string) => void
    ): Promise<RTCSessionDescriptionInit | null> => {
        try {
            // Add them to our participant list
            addParticipant(senderId, senderName);

            // Create connection to them
            const pc = createPeerConnection(senderId, senderName, localStream, onIceCandidate);

            // Set their offer as remote description
            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            // Create our answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Process any ICE candidates we received before the connection was ready
            const pending = pendingCandidatesRef.current.get(senderId) || [];
            for (const candidate of pending) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingCandidatesRef.current.delete(senderId);

            return answer;
        } catch (error) {
            console.error('Error handling offer:', error);
            return null;
        }
    }, [addParticipant, createPeerConnection]);

    /**
     * Handle an incoming answer (they accepted our connection)
     */
    const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit, senderId: string) => {
        try {
            const pc = peerConnectionsRef.current.get(senderId);
            if (pc && pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));

                // Process pending ICE candidates
                const pending = pendingCandidatesRef.current.get(senderId) || [];
                for (const candidate of pending) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
                pendingCandidatesRef.current.delete(senderId);
            }
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    }, []);

    /**
     * Handle an incoming ICE candidate (network routing info)
     */
    const handleIceCandidate = useCallback((candidate: RTCIceCandidateInit, senderId: string) => {
        const pc = peerConnectionsRef.current.get(senderId);

        if (pc && pc.remoteDescription) {
            // Connection is ready, add the candidate now
            pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
        } else {
            // Connection not ready yet, save for later
            const pending = pendingCandidatesRef.current.get(senderId) || [];
            pending.push(candidate);
            pendingCandidatesRef.current.set(senderId, pending);
        }
    }, []);

    /**
     * Close all connections (when leaving the call)
     */
    const closeAllConnections = useCallback(() => {
        peerConnectionsRef.current.forEach(pc => pc.close());
        peerConnectionsRef.current.clear();
        pendingCandidatesRef.current.clear();
        setParticipants(new Map());
    }, []);

    /**
     * Replace our video track in all connections
     * Used for screen sharing or virtual backgrounds
     */
    const replaceVideoTrack = useCallback((newTrack: MediaStreamTrack) => {
        peerConnectionsRef.current.forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
                sender.replaceTrack(newTrack);
            }
        });
    }, []);

    return {
        participants,
        addParticipant,
        removeParticipant,
        createPeerConnection,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
        closeAllConnections,
        replaceVideoTrack,
    };
}
