import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
    value: {
        getUserMedia: vi.fn(),
        getDisplayMedia: vi.fn(),
    },
    writable: true,
});

// Mock MediaStream
class MockMediaStream {
    private tracks: MediaStreamTrack[] = [];

    constructor(tracks: MediaStreamTrack[] = []) {
        this.tracks = tracks;
    }

    getTracks() { return this.tracks; }
    getVideoTracks() { return this.tracks.filter(t => t.kind === 'video'); }
    getAudioTracks() { return this.tracks.filter(t => t.kind === 'audio'); }
    addTrack(track: MediaStreamTrack) { this.tracks.push(track); }
    removeTrack(track: MediaStreamTrack) {
        this.tracks = this.tracks.filter(t => t !== track);
    }
}

// Mock MediaStreamTrack
class MockMediaStreamTrack {
    kind: 'video' | 'audio';
    enabled: boolean = true;
    id: string;

    constructor(kind: 'video' | 'audio') {
        this.kind = kind;
        this.id = Math.random().toString(36);
    }

    stop() { }
}

global.MediaStream = MockMediaStream as unknown as typeof MediaStream;
global.MediaStreamTrack = MockMediaStreamTrack as unknown as typeof MediaStreamTrack;

// Mock RTCPeerConnection
global.RTCPeerConnection = vi.fn().mockImplementation(() => ({
    createOffer: vi.fn().mockResolvedValue({}),
    createAnswer: vi.fn().mockResolvedValue({}),
    setLocalDescription: vi.fn().mockResolvedValue(undefined),
    setRemoteDescription: vi.fn().mockResolvedValue(undefined),
    addTrack: vi.fn(),
    addIceCandidate: vi.fn().mockResolvedValue(undefined),
    getSenders: vi.fn().mockReturnValue([]),
    close: vi.fn(),
    ontrack: null,
    onicecandidate: null,
    onconnectionstatechange: null,
    connectionState: 'new',
    signalingState: 'stable',
})) as unknown as typeof RTCPeerConnection;

global.RTCSessionDescription = vi.fn().mockImplementation((desc) => desc) as unknown as typeof RTCSessionDescription;
global.RTCIceCandidate = vi.fn().mockImplementation((candidate) => candidate) as unknown as typeof RTCIceCandidate;

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(''),
    },
    writable: true,
});
