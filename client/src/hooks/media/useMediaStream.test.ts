import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock navigator.mediaDevices before importing the hook
const mockVideoTrack = {
    kind: 'video' as const,
    enabled: true,
    id: 'video-track-1',
    stop: vi.fn(),
};

const mockAudioTrack = {
    kind: 'audio' as const,
    enabled: true,
    id: 'audio-track-1',
    stop: vi.fn(),
};

const mockStream = {
    getTracks: () => [mockVideoTrack, mockAudioTrack],
    getVideoTracks: () => [mockVideoTrack],
    getAudioTracks: () => [mockAudioTrack],
};

beforeEach(() => {
    vi.clearAllMocks();
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockResolvedValue(mockStream);
    mockVideoTrack.enabled = true;
    mockAudioTrack.enabled = true;
});

// Import hook after mocks are set up
import { useMediaStream } from './useMediaStream';

describe('useMediaStream', () => {
    describe('init', () => {
        it('should request user media on init', async () => {
            const { result } = renderHook(() => useMediaStream());

            await act(async () => {
                await result.current.init();
            });

            expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
                video: true,
                audio: true,
            });
        });

        it('should set initial state to enabled', () => {
            const { result } = renderHook(() => useMediaStream());

            expect(result.current.isVideoEnabled).toBe(true);
            expect(result.current.isAudioEnabled).toBe(true);
        });
    });

    describe('toggleVideo', () => {
        it('should toggle video enabled state', async () => {
            const { result } = renderHook(() => useMediaStream());

            await act(async () => {
                await result.current.init();
            });

            expect(result.current.isVideoEnabled).toBe(true);

            act(() => {
                result.current.toggleVideo();
            });

            expect(result.current.isVideoEnabled).toBe(false);

            act(() => {
                result.current.toggleVideo();
            });

            expect(result.current.isVideoEnabled).toBe(true);
        });

        it('should toggle the video track enabled property', async () => {
            const { result } = renderHook(() => useMediaStream());

            await act(async () => {
                await result.current.init();
            });

            act(() => {
                result.current.toggleVideo();
            });

            expect(mockVideoTrack.enabled).toBe(false);
        });
    });

    describe('toggleAudio', () => {
        it('should toggle audio enabled state', async () => {
            const { result } = renderHook(() => useMediaStream());

            await act(async () => {
                await result.current.init();
            });

            expect(result.current.isAudioEnabled).toBe(true);

            act(() => {
                result.current.toggleAudio();
            });

            expect(result.current.isAudioEnabled).toBe(false);
        });

        it('should toggle the audio track enabled property', async () => {
            const { result } = renderHook(() => useMediaStream());

            await act(async () => {
                await result.current.init();
            });

            act(() => {
                result.current.toggleAudio();
            });

            expect(mockAudioTrack.enabled).toBe(false);
        });
    });

    describe('getVideoTrack', () => {
        it('should return undefined before init', () => {
            const { result } = renderHook(() => useMediaStream());

            expect(result.current.getVideoTrack()).toBeUndefined();
        });
    });

    describe('getLocalStream', () => {
        it('should return null before init', () => {
            const { result } = renderHook(() => useMediaStream());

            expect(result.current.getLocalStream()).toBeNull();
        });
    });
});
