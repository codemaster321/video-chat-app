import React, { memo, useRef, useEffect } from "react";
import { useMediaContext, useUIContext, useCallStateContext } from "../context";

interface VideoCardProps {
    stream?: MediaStream;
    username: string;
    isLocal: boolean;
    isMuted: boolean;
}

const VideoCard: React.FC<VideoCardProps> = memo(({ stream, username, isLocal, isMuted }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="card overflow-hidden aspect-video">
            <div className="relative w-full h-full bg-dark-300">
                {stream ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted={isMuted || isLocal}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-2xl font-bold text-white">
                            {username.charAt(0).toUpperCase()}
                        </div>
                    </div>
                )}

                {/* Username overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-dark-400/80 to-transparent">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-warm-light truncate">
                            {username}
                            {isLocal && <span className="text-warm-light/50 ml-1">(You)</span>}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});

VideoCard.displayName = 'VideoCard';

// Memoized local video card to prevent unnecessary re-renders
const LocalVideoCard: React.FC = memo(() => {
    const { getEffectiveStream, isVideoEnabled, isVirtualBgEnabled } = useMediaContext();
    const { username } = useUIContext();

    // Get the effective stream (canvas if virtual bg, otherwise camera)
    const localStream = getEffectiveStream() || undefined;

    // Force re-render when virtual bg state changes
    const key = isVirtualBgEnabled ? 'vbg' : 'cam';

    return (
        <VideoCard
            key={key}
            stream={isVideoEnabled ? localStream : undefined}
            username={username}
            isLocal={true}
            isMuted={true}
        />
    );
});

LocalVideoCard.displayName = 'LocalVideoCard';

const VideoGrid: React.FC = () => {
    const { participants } = useCallStateContext();

    const participantCount = participants.size + 1; // +1 for local user

    // Determine grid layout based on participant count
    const getGridClass = () => {
        if (participantCount === 1) return "grid-cols-1 max-w-2xl mx-auto";
        if (participantCount === 2) return "grid-cols-2";
        if (participantCount <= 4) return "grid-cols-2";
        return "grid-cols-3";
    };

    return (
        <div className={`grid gap-4 ${getGridClass()}`}>
            {/* Local video */}
            <LocalVideoCard />

            {/* Remote participants */}
            {Array.from(participants.values()).map((participant) => (
                <VideoCard
                    key={participant.id}
                    stream={participant.stream}
                    username={participant.username}
                    isLocal={false}
                    isMuted={false}
                />
            ))}
        </div>
    );
};

export default memo(VideoGrid);
