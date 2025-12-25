import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMeetingTranscript } from './useMeetingTranscript';

describe('useMeetingTranscript', () => {
    describe('addEntry', () => {
        it('should add a transcript entry', () => {
            const { result } = renderHook(() => useMeetingTranscript());

            act(() => {
                result.current.addEntry('Alice', 'Hello everyone');
            });

            expect(result.current.transcript).toContain('Alice');
            expect(result.current.transcript).toContain('Hello everyone');
        });

        it('should add multiple entries', () => {
            const { result } = renderHook(() => useMeetingTranscript());

            act(() => {
                result.current.addEntry('Alice', 'Hello');
                result.current.addEntry('Bob', 'Hi there');
            });

            expect(result.current.transcript).toContain('Alice');
            expect(result.current.transcript).toContain('Hello');
            expect(result.current.transcript).toContain('Bob');
            expect(result.current.transcript).toContain('Hi there');
        });

        it('should not add empty text', () => {
            const { result } = renderHook(() => useMeetingTranscript());

            act(() => {
                result.current.addEntry('Alice', '');
            });

            expect(result.current.transcript).toBe('');
        });

        it('should not add whitespace-only text', () => {
            const { result } = renderHook(() => useMeetingTranscript());

            act(() => {
                result.current.addEntry('Alice', '   ');
            });

            expect(result.current.transcript).toBe('');
        });
    });

    describe('clearTranscript', () => {
        it('should clear all entries', () => {
            const { result } = renderHook(() => useMeetingTranscript());

            act(() => {
                result.current.addEntry('Alice', 'Hello');
                result.current.addEntry('Bob', 'Hi');
                result.current.clearTranscript();
            });

            expect(result.current.transcript).toBe('');
        });
    });

    describe('getFormattedTranscript', () => {
        it('should return empty string when no entries', () => {
            const { result } = renderHook(() => useMeetingTranscript());

            expect(result.current.getFormattedTranscript()).toBe('');
        });

        it('should return formatted transcript with timestamps', () => {
            const { result } = renderHook(() => useMeetingTranscript());

            act(() => {
                result.current.addEntry('Alice', 'Hello');
            });

            const formatted = result.current.getFormattedTranscript();
            expect(formatted).toContain('Alice');
            expect(formatted).toContain('Hello');
        });
    });
});
