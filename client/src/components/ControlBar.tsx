import React from "react";
import { useMediaContext, useUIContext, useCallStateContext, useChatContext } from "../context";
import { Loader2, Phone, PhoneOff, Monitor, MessageCircle, Video, VideoOff, Mic, MicOff, PenTool, Captions, Sparkles, UserPlus } from "lucide-react";

const ControlBar: React.FC = () => {
    const { isVideoEnabled, isAudioEnabled, toggleVideo, toggleAudio, handleStartCapture, isVirtualBgEnabled, isVirtualBgLoading } = useMediaContext();
    const { username, roomInput, setUsername, setRoomInput, setIsWhiteboardOpen, setIsVirtualBgSelectorOpen } = useUIContext();
    const { isChatOpen, setIsChatOpen } = useChatContext();
    const { roomId, isCaptionsEnabled, isSpeechSupported, toggleCaptions, handleMakeCall, handleJoinCall, handleHangup } = useCallStateContext();

    if (!roomId) {
        // Pre-call: Join/Create UI
        return (
            <div className="card-elevated" style={{ padding: '40px 48px', width: '100%', maxWidth: '420px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Username Input */}
                    <div style={{ textAlign: 'center' }}>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '11px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                marginBottom: '12px',
                                color: 'rgba(254, 243, 226, 0.4)'
                            }}
                        >
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your name"
                            className="input"
                            style={{ width: '100%', textAlign: 'center' }}
                        />
                    </div>

                    {/* Start New Call Button */}
                    <button
                        onClick={handleMakeCall}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', width: '100%' }}
                    >
                        <Phone size={20} strokeWidth={2.5} />
                        Start New Call
                    </button>

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(254, 243, 226, 0.08)' }} />
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(254, 243, 226, 0.3)' }}>
                            or join existing
                        </span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(254, 243, 226, 0.08)' }} />
                    </div>

                    {/* Join Call */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <input
                            type="text"
                            value={roomInput}
                            onChange={(e) => setRoomInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleJoinCall()}
                            placeholder="Room code"
                            className="input"
                            style={{ flex: 1, textAlign: 'center', fontFamily: 'monospace' }}
                        />
                        <button
                            onClick={handleJoinCall}
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <UserPlus size={18} />
                            Join
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // In-call controls
    return (
        <div className="card" style={{ padding: '20px 32px', marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                {/* Audio */}
                <button
                    onClick={toggleAudio}
                    className={`icon-btn ${!isAudioEnabled ? "danger" : ""}`}
                    title={isAudioEnabled ? "Mute" : "Unmute"}
                >
                    {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>

                {/* Video */}
                <button
                    onClick={toggleVideo}
                    className={`icon-btn ${!isVideoEnabled ? "danger" : ""}`}
                    title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                >
                    {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                </button>

                {/* Virtual Background */}
                <button
                    onClick={() => setIsVirtualBgSelectorOpen(true)}
                    className={`icon-btn ${isVirtualBgEnabled ? "active" : ""}`}
                    title="Virtual background"
                    disabled={isVirtualBgLoading}
                >
                    {isVirtualBgLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                </button>

                {/* Screen Share */}
                <button onClick={handleStartCapture} className="icon-btn" title="Share screen">
                    <Monitor size={20} />
                </button>

                {/* Chat */}
                <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className={`icon-btn ${isChatOpen ? "active" : ""}`}
                    title="Toggle chat"
                >
                    <MessageCircle size={20} />
                </button>

                {/* Whiteboard */}
                <button
                    onClick={() => setIsWhiteboardOpen(true)}
                    className="icon-btn"
                    title="Open whiteboard"
                >
                    <PenTool size={20} />
                </button>

                {/* Captions */}
                <button
                    onClick={toggleCaptions}
                    className={`icon-btn ${isCaptionsEnabled ? "active" : ""} ${!isSpeechSupported ? "opacity-40 cursor-not-allowed" : ""}`}
                    title={!isSpeechSupported ? "Not supported" : "Captions"}
                    disabled={!isSpeechSupported}
                >
                    <Captions size={20} />
                </button>

                {/* Divider */}
                <div style={{ width: '1px', height: '40px', margin: '0 8px', backgroundColor: 'rgba(254, 243, 226, 0.1)' }} />

                {/* Hang Up */}
                <button onClick={handleHangup} className="icon-btn danger" title="End call">
                    <PhoneOff size={20} />
                </button>
            </div>
        </div>
    );
};

export default ControlBar;
