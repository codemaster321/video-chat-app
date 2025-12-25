import React from "react";

// Import providers from subfolders
import { UIProvider, ChatProvider } from "./ui";
import { MediaProvider } from "./media";
import { SpeechProvider, TranscriptProvider, SummaryProvider, MeetingProvider } from "./meeting";
import { CallStateProvider } from "./call";

/**
 * AppProvider - Combines all context providers
 * 
 * Order matters! Inner providers depend on outer ones:
 * 1. UIProvider - basic UI state (no dependencies)
 * 2. ChatProvider - chat state (no dependencies)
 * 3. MediaProvider - camera/audio (no dependencies)
 * 4. SpeechProvider - speech recognition (no dependencies)
 * 5. TranscriptProvider - meeting transcript (no dependencies)
 * 6. SummaryProvider - AI summary (no dependencies)
 * 7. MeetingProvider - captions + post-call (depends on Speech, Transcript)
 * 8. CallStateProvider - room + signaling (depends on all above)
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
    return (
        <UIProvider>
            <ChatProvider>
                <MediaProvider>
                    <SpeechProvider>
                        <TranscriptProvider>
                            <SummaryProvider>
                                <MeetingProvider>
                                    <CallStateProvider>
                                        {children}
                                    </CallStateProvider>
                                </MeetingProvider>
                            </SummaryProvider>
                        </TranscriptProvider>
                    </SpeechProvider>
                </MediaProvider>
            </ChatProvider>
        </UIProvider>
    );
}
