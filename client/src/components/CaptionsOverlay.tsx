import React from "react";
import { Captions } from "lucide-react";
import { useCallStateContext } from "../context";

const CaptionsOverlay: React.FC = () => {
    const { isCaptionsEnabled, remoteCaptions, transcript, interimTranscript, isSpeechSupported } = useCallStateContext();

    if (!isCaptionsEnabled && !remoteCaptions) return null;

    return (
        <div className="glass rounded-xl p-4 mb-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
                <Captions className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-400">Live Captions</span>
                {!isSpeechSupported && (
                    <span className="text-xs text-rose-400">(Not supported in this browser)</span>
                )}
            </div>

            {/* Remote captions */}
            {remoteCaptions && (
                <div className="mb-2">
                    <span className="text-xs text-warm-light/50">{remoteCaptions.sender}: </span>
                    <span className="text-warm-light">{remoteCaptions.text}</span>
                </div>
            )}

            {/* Local captions */}
            {(transcript || interimTranscript) && (
                <div>
                    <span className="text-xs text-warm-light/50">You: </span>
                    <span className="text-warm-light">{transcript}</span>
                    <span className="text-warm-light/50 italic">{interimTranscript}</span>
                </div>
            )}
        </div>
    );
};

export default CaptionsOverlay;
