// Application constants

// Server configuration
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

// Timing constants (in milliseconds)
export const NOTIFICATION_DURATION = 3000;
export const CAPTION_DISPLAY_DURATION = 4000;
export const ROOM_CODE_LENGTH = 6;

// WebRTC configuration
export const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

// Whiteboard limits
export const MAX_WHITEBOARD_STROKES = 5000;
