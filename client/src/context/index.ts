// Main context barrel export
// Re-export all contexts from subfolders for convenient imports

// UI
export { UIProvider, useUIContext, ChatProvider, useChatContext } from './ui';

// Media
export { MediaProvider, useMediaContext, setReplaceVideoTrackFn } from './media';

// Meeting
export {
    SpeechProvider, useSpeechContext,
    TranscriptProvider, useTranscriptContext,
    SummaryProvider, useSummaryContext,
    MeetingProvider, useMeetingContext
} from './meeting';

// Call
export { CallStateProvider, useCallStateContext } from './call';

// AppProvider (main entry point)
export { AppProvider } from './AppProvider';
