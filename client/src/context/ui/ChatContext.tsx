import React, { createContext, useContext, useState, useCallback } from "react";
import type { ChatMessage } from "../../types/index";

// ============ TYPES ============
interface ChatContextType {
    messages: ChatMessage[];
    chatMessage: string;
    isChatOpen: boolean;
    setChatMessage: (value: string) => void;
    setIsChatOpen: (value: boolean) => void;
    addMessage: (msg: ChatMessage) => void;
    clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChatContext() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChatContext must be used within ChatProvider");
    }
    return context;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatMessage, setChatMessage] = useState("");
    const [isChatOpen, setIsChatOpen] = useState(false);

    const addMessage = useCallback((msg: ChatMessage) => {
        setMessages(prev => [...prev, msg]);
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    const value: ChatContextType = {
        messages, chatMessage, isChatOpen,
        setChatMessage, setIsChatOpen, addMessage, clearMessages,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
