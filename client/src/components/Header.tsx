import React from "react";
import { Copy, Check, Users, Wifi } from "lucide-react";
import { useUIContext, useCallStateContext } from "../context";

const Header: React.FC = () => {
    const { isCopied } = useUIContext();
    const { roomId, participants, connectionStatus, copyRoomCode } = useCallStateContext();

    return (
        <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="text-gradient text-xl font-bold">NexusMeet</div>
                {roomId && (
                    <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
                        <span className="text-sm font-mono text-warm-light/70">{roomId}</span>
                        <button
                            onClick={copyRoomCode}
                            className="hover:text-primary-400 transition-colors"
                            title="Copy room code"
                        >
                            {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                    </div>
                )}
            </div>

            {roomId && (
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-warm-light/50">
                        <Users size={16} />
                        <span>{participants.size + 1}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Wifi size={14} className={connectionStatus === 'Connected' ? 'text-emerald-400' : 'text-amber-400'} />
                        <span className={connectionStatus === 'Connected' ? 'text-emerald-400' : 'text-amber-400'}>
                            {connectionStatus}
                        </span>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
