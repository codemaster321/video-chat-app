import React, { createContext, useContext, useState, useCallback } from "react";

// ============ TYPES ============
interface UIContextType {
    // Modals
    isWhiteboardOpen: boolean;
    isVirtualBgSelectorOpen: boolean;
    setIsWhiteboardOpen: (value: boolean) => void;
    setIsVirtualBgSelectorOpen: (value: boolean) => void;

    // Notifications
    notifications: string[];
    addNotification: (message: string) => void;

    // User
    username: string;
    setUsername: (value: string) => void;
    roomInput: string;
    setRoomInput: (value: string) => void;

    // Copy state
    isCopied: boolean;
    setIsCopied: (value: boolean) => void;
}

const UIContext = createContext<UIContextType | null>(null);

export function useUIContext() {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error("useUIContext must be used within UIProvider");
    }
    return context;
}

export function UIProvider({ children }: { children: React.ReactNode }) {
    // Modals
    const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
    const [isVirtualBgSelectorOpen, setIsVirtualBgSelectorOpen] = useState(false);

    // Notifications
    const [notifications, setNotifications] = useState<string[]>([]);

    // User
    const [username, setUsername] = useState(() => `User-${Math.random().toString(36).substring(2, 6)}`);
    const [roomInput, setRoomInput] = useState("");

    // Copy
    const [isCopied, setIsCopied] = useState(false);

    const addNotification = useCallback((message: string) => {
        setNotifications(prev => [...prev, message]);
        setTimeout(() => setNotifications(prev => prev.slice(1)), 5000);
    }, []);

    const value: UIContextType = {
        isWhiteboardOpen, isVirtualBgSelectorOpen,
        setIsWhiteboardOpen, setIsVirtualBgSelectorOpen,
        notifications, addNotification,
        username, setUsername, roomInput, setRoomInput,
        isCopied, setIsCopied,
    };

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}
