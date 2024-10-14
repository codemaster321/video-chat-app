const socket = io("http://localhost:3000"); // Connect to the Socket.IO server

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const screenShare = document.getElementById("screenshare");
const chat = document.getElementById("chat");
const chatWindow = document.querySelector(".chat-window");
const input = document.getElementById("input");

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

  // Handle remote stream tracks
  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
    remoteVideo.srcObject = remoteStream;
    console.log(remoteVideo);
  };

  // Handle ICE candidate generation
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", event.candidate);
    }
  };
}

socket.on("chat message", (msg) => {
  console.log("message: " + msg);
  const newMessage = document.createElement("li");
  newMessage.textContent = msg;
  document.getElementById("messages").append(newMessage);
});

// Start a call by creating an offer
async function makeCall() {
  createPeerConnection();
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", offer);
}

// Handle incoming offer from remote peer
socket.on("offer", async (offer) => {
  createPeerConnection();
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", answer);
});

// Handle incoming answer from remote peer
socket.on("answer", async (answer) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// Handle incoming ICE candidate from remote peer
socket.on("ice-candidate", async (candidate) => {
  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (error) {
    console.error("Error adding ICE candidate:", error);
  }
});

socket.on("leave", () => {
  console.log("Remote peer left, cleaning up connection.");
  stopLocalStream();
  closePeerConnection();
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
});

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
    sender.replaceTrack(screenTrack);

    localVideo.srcObject = captureStream; // Show screen locally

    // Listen for when the user stops sharing the screen
  } catch (err) {
    console.error(`Error: ${err}`);
  }
}

init();

document.getElementById("makeCallButton").addEventListener("click", makeCall);
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
