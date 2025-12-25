import React, { useEffect } from "react";
import { useMediaContext, useUIContext } from "../context";
import ControlBar from "./ControlBar";
import { Loader2 } from "lucide-react";

const PreCallScreen: React.FC = () => {
    const { localVideoRef, isVideoEnabled, isMediaLoading, reassignStream } = useMediaContext();
    const { username } = useUIContext();

    // Reassign the stream to the video element when component mounts
    useEffect(() => {
        reassignStream();
    }, [reassignStream]);
    if (isMediaLoading) {
        return (
            <div
                className="animate-fade-in"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '90vh',
                    padding: '48px 24px'
                }}
            >
                <Loader2 size={48} className="animate-spin" style={{ color: '#fb923c', marginBottom: '24px' }} />
                <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#fef3e2', marginBottom: '12px' }}>
                    Setting up camera...
                </h2>
                <p style={{ fontSize: '14px', color: 'rgba(254, 243, 226, 0.5)' }}>
                    Please allow camera and microphone access
                </p>
            </div>
        );
    }

    return (
        <div
            className="animate-fade-in"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '90vh',
                padding: '48px 24px'
            }}
        >
            {/* Title */}
            <h1 style={{ fontSize: '40px', fontWeight: 700, marginBottom: '12px' }}>
                <span className="text-gradient">NexusMeet</span>
            </h1>

            <p style={{ fontSize: '18px', color: 'rgba(254, 243, 226, 0.5)', marginBottom: '56px' }}>
                Premium video conferencing with AI
            </p>

            {/* Video Preview */}
            <div style={{ position: 'relative', marginBottom: '40px' }}>
                <div
                    style={{
                        position: 'absolute',
                        inset: '-4px',
                        background: 'linear-gradient(135deg, #f97316, #f59e0b, #f97316)',
                        borderRadius: '20px',
                        opacity: 0.3,
                        filter: 'blur(12px)'
                    }}
                />

                <div
                    className="video-card"
                    style={{ position: 'relative', width: '420px', maxWidth: '85vw', aspectRatio: '16/9' }}
                >
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }}
                    />
                    <div className="overlay" />

                    {!isVideoEnabled && (
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(15, 10, 7, 0.85)',
                                borderRadius: '16px'
                            }}
                        >
                            <div
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(254, 243, 226, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '12px'
                                }}
                            >
                                <span style={{ fontSize: '28px' }}>📷</span>
                            </div>
                            <span style={{ fontSize: '14px', color: 'rgba(254, 243, 226, 0.5)' }}>Camera off</span>
                        </div>
                    )}

                    <div className="label">{username || 'You'}</div>
                </div>
            </div>

            <ControlBar />
        </div>
    );
};

export default PreCallScreen;
