const socket = io("http://localhost:3000"); // Connect to the Socket.IO server

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const screenShare = document.getElementById("screenshare");
const chat = document.getElementById("chat");
const chatWindow = document.querySelector(".chat-window");
const input = document.getElementById("input");

let roomId = null;
let isCaller = false;
let localStream;
let remoteStream = new MediaStream(); // Create a new MediaStream for the remote video
let peerConnection;
let shareStream = new MediaStream();

const displayMediaOptions = {
  video: {
    displaySurface: "window",
  },
  audio: false,
};

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }], // STUN server for NAT traversal
};

async function init() {
  try {
    const constraints = { video: true, audio: true };
    console.log(navigator.mediaDevices);
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    localVideo.srcObject = localStream; // Set the local video element's source to the local stream
  } catch (error) {
    console.error("Error accessing media devices:", error);
  }
}

// Implement Signalling for the peers to be able to connect with each other
// Code goes here
function createPeerConnection() {
  peerConnection = new RTCPeerConnection(config);

  if (!localStream) {
    console.error("Local stream is not initialized!");
    return;
  }

  // Add local stream tracks to the peer connection
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });
  peerConnection.ontrack = (event) => {
    const stream = event.streams[0];
    stream.getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
    remoteVideo.srcObject = remoteStream;
  };

  // Start a call by creating an offer

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        candidate: event.candidate,
        room: roomId,
      });
    }
  };
}

// Stop all local media tracks
function stopLocalStream() {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    console.log("Local stream stopped.");
  }
}

// Close the peer connection
function closePeerConnection() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
    console.log("Peer connection closed.");
  }
}

async function startCapture() {
  let captureStream = null;

  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia(
      displayMediaOptions
    );
    const screenTrack = captureStream.getVideoTracks()[0];
    const sender = peerConnection
      .getSenders()
      .find((s) => s.track.kind === "video");
    console.log(peerConnection.getSenders());
    sender.replaceTrack(screenTrack);

    remoteVideo.srcObject = captureStream;

    screenTrack.onended = async () => {
      console.log("Screen sharing stopped");

      try {
        // Replace back with webcam video
        const webcamTrack = localStream.getVideoTracks()[0];
        if (webcamTrack) {
          sender.replaceTrack(webcamTrack);
        }

        // Restore local video feed
        localVideo.srcObject = localStream;

        // Clear screenShare element
        remoteVideo.srcObject.getTracks().forEach((track) => track.stop());
        remoteVideo.srcObject = localStream;
      } catch (err) {
        console.error("Error restoring webcam after screen share:", err);
      }
    };

    // Listen for when the user stops sharing the screen
  } catch (err) {
    console.error(`Error: ${err}`);
  }
}

async function makeCall() {
  createPeerConnection();

  if (!localVideo && !peerConnection) init();
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", { offer, room: roomId });
  console.log("Offer sent:", offer);
}

// Handle incoming offer from remote peer
socket.on("offer", async ({ offer }) => {
  createPeerConnection();
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", { answer, room: roomId });
});

socket.on("answer", async ({ answer }) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("ready", () => {
  if (isCaller) {
    makeCall();
  }
});

socket.on("leave", () => {
  console.log("Remote peer left, cleaning up connection.");
  stopLocalStream();
  closePeerConnection();
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;

  remoteStream = new MediaStream(); // Reset for next time
});

socket.on("ice-candidate", async ({ candidate }) => {
  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (error) {
    console.error("Error adding ICE candidate:", error);
  }
});

socket.on("chat message", (msg) => {
  console.log("message: " + msg);
  const newMessage = document.createElement("li");
  newMessage.textContent = msg;
  document.getElementById("messages").append(newMessage);
});

document.getElementById("makeCallButton").addEventListener("click", () => {
  roomId = Math.random().toString(36).substring(2, 8);
  alert(`Share this code with your friend: ${roomId}`);
  isCaller = true;

  socket.emit("join-room", roomId);
});

document.getElementById("joinCallButton").addEventListener("click", () => {
  const input = document.getElementById("roomInput").value.trim();
  if (!input) return alert("Please enter a valid code.");
  roomId = input;
  isCaller = false;

  socket.emit("join-room", roomId);
});

document.getElementById("hangupButton").addEventListener("click", () => {
  stopLocalStream();
  closePeerConnection();
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
});
document
  .getElementById("screenShareButton")
  .addEventListener("click", () => startCapture());

document.getElementById("chat").addEventListener("click", (e) => {
  chatWindow.classList.toggle("chat-window-active");
  console.log("heeree");
});
document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();

  if (input.value) {
    socket.emit("chat message", input.value);
    input.value = "";
    const chatWindow = document.querySelector(".chat-container");
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
});

init();
