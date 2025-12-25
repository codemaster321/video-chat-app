import React from "react";
import { X, Send } from "lucide-react";
import { useChatContext, useCallStateContext } from "../context";

const ChatPanel: React.FC = () => {
    const { messages, chatMessage, setChatMessage, setIsChatOpen } = useChatContext();
    const { handleChatSubmit } = useCallStateContext();

    return (
        <div className="card w-80 flex flex-col h-[calc(100vh-200px)] animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-warm-light/10">
                <h3 className="font-semibold text-warm-light">Chat</h3>
                <button onClick={() => setIsChatOpen(false)} className="icon-btn !w-8 !h-8">
                    <X size={16} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="text-center text-warm-light/40 text-sm py-8">
                        No messages yet
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                            <span className="text-xs text-warm-light/40 mb-1">{msg.sender}</span>
                            <div
                                className={`px-3 py-2 rounded-xl max-w-[80%] ${msg.isOwn
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-warm-light/10 text-warm-light'
                                    }`}
                            >
                                {msg.message}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-warm-light/10">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit(e)}
                        placeholder="Type a message..."
                        className="input flex-1 !py-2"
                    />
                    <button
                        onClick={handleChatSubmit}
                        className="btn-primary !px-3 !py-2"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatPanel;
