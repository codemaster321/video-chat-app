import React from "react";
import { AppProvider, useUIContext, useCallStateContext, useChatContext } from "./context";

// Components
import Header from "./components/Header";
import VideoGrid from "./components/VideoGrid";
import ControlBar from "./components/ControlBar";
import ChatPanel from "./components/ChatPanel";
import CaptionsOverlay from "./components/CaptionsOverlay";
import Notifications from "./components/Notifications";
import Whiteboard from "./components/Whiteboard";
import VirtualBackgroundSelector from "./components/VirtualBackgroundSelector";
import PostCallScreen from "./components/PostCallScreen";
import PreCallScreen from "./components/PreCallScreen";
import ErrorBoundary from "./components/ErrorBoundary";

// ============ MAIN CONTENT ============
function MainContent() {
  const { isWhiteboardOpen, isVirtualBgSelectorOpen, notifications, setIsWhiteboardOpen, setIsVirtualBgSelectorOpen } = useUIContext();
  const { roomId, showPostCall, socket } = useCallStateContext();
  const { isChatOpen } = useChatContext();

  return (
    <div className="app-bg text-white p-6">
      <Notifications notifications={notifications} />
      <Header />

      <div className="max-w-7xl mx-auto">
        {roomId ? (
          // In-call view
          <div className="flex gap-6">
            <div className="flex-1">
              <VideoGrid />
              <CaptionsOverlay />
              <ControlBar />
            </div>

            {isChatOpen && <ChatPanel />}
          </div>
        ) : showPostCall ? (
          <PostCallScreen />
        ) : (
          <PreCallScreen />
        )}
      </div>

      {/* Modals */}
      {isWhiteboardOpen && (
        <Whiteboard socket={socket} roomId={roomId} onClose={() => setIsWhiteboardOpen(false)} />
      )}

      <VirtualBackgroundSelector
        isOpen={isVirtualBgSelectorOpen}
        onClose={() => setIsVirtualBgSelectorOpen(false)}
      />
    </div>
  );
}

// ============ APP ============
const VideoCallApp: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </ErrorBoundary>
  );
};

export default VideoCallApp;
