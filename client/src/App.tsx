import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

const VideoCallApp: React.FC = () => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const isCallerRef = useRef<boolean>(false);
  const [roomInput, setRoomInput] = useState<string>("");
  const [chatMessage, setChatMessage] = useState<string>("");
  const [messages, setMessages] = useState<string[]>([]);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Disconnected");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const displayMediaOptions: DisplayMediaStreamOptions = {
    video: {
      displaySurface: "window",
    } as MediaTrackConstraints,
    audio: false,
  };

  const config: RTCConfiguration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io("http://localhost:3000");
    remoteStreamRef.current = new MediaStream();

    // Initialize media
    init();

    // Socket event listeners
    socketRef.current.on("offer", handleOffer);
    socketRef.current.on("answer", handleAnswer);
    socketRef.current.on("ready", handleReady);
    socketRef.current.on("leave", handleLeave);
    socketRef.current.on("ice-candidate", handleIceCandidate);
    socketRef.current.on("chat message", handleChatMessage);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      stopLocalStream();
      closePeerConnection();
    };
  }, []);

  const init = async (): Promise<void> => {
    try {
      const constraints: MediaStreamConstraints = { video: true, audio: true };
      localStreamRef.current = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const createPeerConnection = (): void => {
    peerConnectionRef.current = new RTCPeerConnection(config);

    if (!localStreamRef.current) {
      console.error("Local stream is not initialized!");
      return;
    }

    // Add connection state monitoring
    peerConnectionRef.current.onconnectionstatechange = () => {
      if (peerConnectionRef.current) {
        console.log(
          "Connection state:",
          peerConnectionRef.current.connectionState
        );
        setConnectionStatus(peerConnectionRef.current.connectionState);
      }
    };

    peerConnectionRef.current.oniceconnectionstatechange = () => {
      if (peerConnectionRef.current) {
        console.log(
          "ICE connection state:",
          peerConnectionRef.current.iceConnectionState
        );
      }
    };

    // Add local stream tracks to the peer connection
    localStreamRef.current.getTracks().forEach((track) => {
      if (peerConnectionRef.current && localStreamRef.current) {
        console.log("Adding track:", track.kind);
        peerConnectionRef.current.addTrack(track, localStreamRef.current);
      }
    });

    // Handle incoming remote streams
    peerConnectionRef.current.ontrack = (event: RTCTrackEvent) => {
      console.log("Received remote track:", event.track.kind);
      const [remoteStream] = event.streams;

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        console.log("Remote stream set to video element");
      }
    };

    peerConnectionRef.current.onicecandidate = (
      event: RTCPeerConnectionIceEvent
    ) => {
      if (event.candidate && socketRef.current) {
        console.log("Sending ICE candidate");
        socketRef.current.emit("ice-candidate", {
          candidate: event.candidate,
          room: roomId,
        });
      }
    };
  };

  const stopLocalStream = (): void => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      console.log("Local stream stopped.");
    }
  };

  const closePeerConnection = (): void => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
      console.log("Peer connection closed.");
    }
  };

  const startCapture = async (): Promise<void> => {
    try {
      const captureStream = await navigator.mediaDevices.getDisplayMedia(
        displayMediaOptions
      );
      const screenTrack = captureStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        ?.getSenders()
        .find((s) => s.track && s.track.kind === "video");

      if (sender) {
        await sender.replaceTrack(screenTrack);
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = captureStream;
      }

      screenTrack.onended = async () => {
        console.log("Screen sharing stopped");
        try {
          const webcamTrack = localStreamRef.current?.getVideoTracks()[0];
          if (webcamTrack && sender) {
            await sender.replaceTrack(webcamTrack);
          }

          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }

          if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
            const tracks = (
              remoteVideoRef.current.srcObject as MediaStream
            ).getTracks();
            tracks.forEach((track) => track.stop());
            if (localStreamRef.current) {
              remoteVideoRef.current.srcObject = localStreamRef.current;
            }
          }
        } catch (err) {
          console.error("Error restoring webcam after screen share:", err);
        }
      };
    } catch (err) {
      console.error(`Error: ${err}`);
    }
  };

  const makeCall = async (): Promise<void> => {
    console.log("Making call...");
    createPeerConnection();
    if (!localVideoRef.current && !peerConnectionRef.current) {
      await init();
    }

    if (peerConnectionRef.current) {
      try {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        console.log("Offer created and local description set");

        if (socketRef.current) {
          socketRef.current.emit("offer", { offer, room: roomId });
          console.log("Offer sent");
        }
      } catch (error) {
        console.error("Error making call:", error);
      }
    }
  };

  const handleOffer = async ({
    offer,
  }: {
    offer: RTCSessionDescriptionInit;
  }): Promise<void> => {
    console.log("Received offer - this peer is joining the call");

    // Ensure we have local stream before creating peer connection
    if (!localStreamRef.current) {
      console.log("No local stream, initializing...");
      await init();
    }

    createPeerConnection();

    await new Promise((res) => setTimeout(res, 0)); // Ensures tracks are added
    if (peerConnectionRef.current) {
      try {
        console.log("Setting remote description from offer...");
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        console.log("Remote description set from offer");

        // Process any pending ICE candidates
        await processPendingIceCandidates();

        console.log("Creating answer...");
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        console.log("Answer created and local description set");

        if (socketRef.current) {
          socketRef.current.emit("answer", { answer, room: roomId });
          console.log("Answer sent to room:", roomId);
        }
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    }
  };

  const handleAnswer = async ({
    answer,
  }: {
    answer: RTCSessionDescriptionInit;
  }): Promise<void> => {
    console.log("Received answer - this peer made the call");
    if (peerConnectionRef.current) {
      try {
        console.log("Setting remote description from answer...");
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        console.log("Remote description set from answer");

        // Process any pending ICE candidates
        await processPendingIceCandidates();
      } catch (error) {
        console.error("Error handling answer:", error);
      }
    }
  };

  const processPendingIceCandidates = async (): Promise<void> => {
    if (
      peerConnectionRef.current &&
      pendingIceCandidatesRef.current.length > 0
    ) {
      console.log(
        "Processing",
        pendingIceCandidatesRef.current.length,
        "pending ICE candidates"
      );
      for (const candidate of pendingIceCandidatesRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (error) {
          console.error("Error adding pending ICE candidate:", error);
        }
      }
      pendingIceCandidatesRef.current = [];
    }
  };

  const handleReady = (): void => {
    console.log("Room ready event received. isCaller:", isCallerRef.current);
    if (isCallerRef.current) {
      console.log("Caller starting the call...");
      makeCall();
    } else {
      console.log("Joiner waiting for offer...");
    }
  };

  const handleLeave = (): void => {
    console.log("Remote peer left, cleaning up connection.");
    stopLocalStream();
    closePeerConnection();
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    remoteStreamRef.current = new MediaStream();
  };

  const handleIceCandidate = async ({
    candidate,
  }: {
    candidate: RTCIceCandidateInit;
  }): Promise<void> => {
    try {
      if (
        peerConnectionRef.current &&
        peerConnectionRef.current.remoteDescription
      ) {
        console.log("Adding ICE candidate");
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } else {
        console.log("Queuing ICE candidate - no remote description yet");
        pendingIceCandidatesRef.current.push(candidate);
      }
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  };

  const handleChatMessage = (msg: string): void => {
    console.log("message: " + msg);
    setMessages((prev) => [...prev, msg]);
  };

  const handleMakeCall = async (): Promise<void> => {
    const newRoomId = Math.random().toString(36).substring(2, 8);
    setRoomId(newRoomId);
    alert(`Share this code with your friend: ${newRoomId}`);
    isCallerRef.current = true;

    console.log("Making call with room ID:", newRoomId);

    // Ensure we have local stream before making call
    if (!localStreamRef.current) {
      console.log("Initializing local stream before making call...");
      await init();
    }

    if (socketRef.current) {
      socketRef.current.emit("join-room", newRoomId);
      console.log("Joined room as caller");
    }
  };

  const handleJoinCall = async (): Promise<void> => {
    if (!roomInput.trim()) {
      alert("Please enter a valid code.");
      return;
    }

    console.log("Joining call with code:", roomInput);
    setRoomId(roomInput);
    isCallerRef.current = false;

    // Ensure we have local stream before joining
    if (!localStreamRef.current) {
      console.log("Initializing local stream before joining...");
      await init();
    }

    if (socketRef.current) {
      socketRef.current.emit("join-room", roomInput);
      console.log("Join room event sent");
    }
  };

  const handleHangup = (): void => {
    stopLocalStream();
    closePeerConnection();
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setConnectionStatus("disconnected");
  };

  const handleChatSubmit = (
    e: React.MouseEvent | React.KeyboardEvent
  ): void => {
    e.preventDefault();
    if (chatMessage.trim() && socketRef.current) {
      socketRef.current.emit("chat message", chatMessage);
      setChatMessage("");
      if (chatContainerRef.current) {
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
              chatContainerRef.current.scrollHeight;
          }
        }, 0);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col gap-10 items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-5xl font-bold text-center mb-10 ">Video Call App</h1>

      <div className="max-w-20xl mx-auto flex flex-col ">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 bg-black rounded object-cover"
            />
            <h3 className="text-center mt-2 font-semibold">Local Stream</h3>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-64 bg-black rounded object-cover"
            />
            <h3 className="text-center mt-2 font-semibold">Remote Stream</h3>
            <div className="flex items-center justify-center mt-2 space-x-2 gap-2">
              <p className="text-sm text-gray-400">
                Status: {connectionStatus}
              </p>
              {connectionStatus === "connected" ? (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              ) : (
                <span className="h-3 w-3  rounded-full bg-red-500"></span>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <Button
              onClick={handleMakeCall}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Make Call
            </Button>

            <Input
              type="text"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              placeholder="Enter Code to Join"
              className="px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            />

            <Button
              onClick={handleJoinCall}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Join Call
            </Button>

            <button
              onClick={handleHangup}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Hangup
            </button>

            <Button
              onClick={startCapture}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Share Screen
            </Button>

            <Button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Chat
            </Button>
          </div>
        </div>

        {/* Chat Window */}
        {isChatOpen && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Chat</h3>
            <div
              ref={chatContainerRef}
              className="bg-gray-700 rounded p-4 h-64 overflow-y-auto mb-4"
            >
              <ul className="space-y-2">
                {messages.map((msg, index) => (
                  <li
                    key={index}
                    className="bg-gray-600 rounded p-2 break-words"
                  >
                    {msg}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                autoComplete="off"
              />
              <Button
                onClick={handleChatSubmit}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-semibold transition-colors"
              >
                Send
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCallApp;
