'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import useSocket from '../../../hooks/useSocket';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhone } from 'react-icons/fa';


const ICE_SERVERS = {
  iceServers: [
    {
      urls: 'stun:openrelay.metered.ca:80',
    }
  ],
};

export default function Room ({ params })  {
  useSocket();
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);

  const router = useRouter();
  const userVideoRef = useRef();
  const peerVideoRef = useRef();
  const rtcConnectionRef = useRef(null);
  const socketRef = useRef();
  const userStreamRef = useRef();
  const hostRef = useRef(false);

  const { id: roomName } = params;
  useEffect(() => {
    socketRef.current = io();
    // First we join a room
    socketRef.current.emit('join', roomName);

    socketRef.current.on('joined', handleRoomJoined);
    // If the room didn't exist, the server would emit the room was 'created'
    socketRef.current.on('created', handleRoomCreated);
    // Whenever the next person joins, the server emits 'ready'
    socketRef.current.on('ready', initiateCall);

    // Emitted when a peer leaves the room
    socketRef.current.on('leave', onPeerLeave);

    // If the room is full, we show an alert
    socketRef.current.on('full', () => {
      window.location.href = '/';
    });

    // Event called when a remote user initiating the connection and
    socketRef.current.on('offer', handleReceivedOffer);
    socketRef.current.on('answer', handleAnswer);
    socketRef.current.on('ice-candidate', handlerNewIceCandidateMsg);

    // clear up after
    return () => socketRef.current.disconnect();
  }, [roomName]);

  const handleRoomJoined = () => {
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: { width: 500, height: 500 },
      })
      .then((stream) => {
        /* use the stream */
        userStreamRef.current = stream;
        userVideoRef.current.srcObject = stream;
        userVideoRef.current.onloadedmetadata = () => {
          userVideoRef.current.play();
        };
        socketRef.current.emit('ready', roomName);
      })
      .catch((err) => {
        /* handle the error */
        console.log('error', err);
      });
  };



  const handleRoomCreated = () => {
    hostRef.current = true;
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: { width: 500, height: 500 },
      })
      .then((stream) => {
        /* use the stream */
        userStreamRef.current = stream;
        userVideoRef.current.srcObject = stream;
        userVideoRef.current.onloadedmetadata = () => {
          userVideoRef.current.play();
        };
      })
      .catch((err) => {
        /* handle the error */
        console.log(err);
      });
  };

  const initiateCall = () => {
    if (hostRef.current) {
      rtcConnectionRef.current = createPeerConnection();
      rtcConnectionRef.current.addTrack(
        userStreamRef.current.getTracks()[0],
        userStreamRef.current,
      );
      rtcConnectionRef.current.addTrack(
        userStreamRef.current.getTracks()[1],
        userStreamRef.current,
      );
      rtcConnectionRef.current
        .createOffer()
        .then((offer) => {
          rtcConnectionRef.current.setLocalDescription(offer).then(() => {
              console.log(rtcConnectionRef.current);
              console.log("OFFER = " + rtcConnectionRef.current.localDescription.sdp.match(/a=fingerprint:sha-256\s(.+)/)[1]);
          });
          socketRef.current.emit('offer', offer, roomName);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  const onPeerLeave = () => {
    // This person is now the creator because they are the only person in the room.
    hostRef.current = true;
    if (peerVideoRef.current.srcObject) {
      peerVideoRef.current.srcObject
        .getTracks()
        .forEach((track) => track.stop()); // Stops receiving all track of Peer.
    }

    // Safely closes the existing connection established with the peer who left.
    if (rtcConnectionRef.current) {
      rtcConnectionRef.current.ontrack = null;
      rtcConnectionRef.current.onicecandidate = null;
      rtcConnectionRef.current.close();
      rtcConnectionRef.current = null;
    }
  }

  /**
   * Takes a userid which is also the socketid and returns a WebRTC Peer
   *
   * @param  {string} userId Represents who will receive the offer
   * @returns {RTCPeerConnection} peer
   */

  const createPeerConnection = () => {
    // We create a RTC Peer Connection
    const connection = new RTCPeerConnection(ICE_SERVERS);

    // We implement our onicecandidate method for when we received a ICE candidate from the STUN server
    connection.onicecandidate = handleICECandidateEvent;

    // We implement our onTrack method for when we receive tracks
    connection.ontrack = handleTrackEvent;
    return connection;

  };

  const handleReceivedOffer = (offer) => {
      console.log("OFFER = " + offer.sdp.match(/a=fingerprint:sha-256\s(.+)/)[1]);
    if (!hostRef.current) {
      rtcConnectionRef.current = createPeerConnection();
      rtcConnectionRef.current.addTrack(
        userStreamRef.current.getTracks()[0],
        userStreamRef.current,
      );
      rtcConnectionRef.current.addTrack(
        userStreamRef.current.getTracks()[1],
        userStreamRef.current,
      );
      rtcConnectionRef.current.setRemoteDescription(offer);

      rtcConnectionRef.current
        .createAnswer()
        .then((answer) => {
          rtcConnectionRef.current.setLocalDescription(answer);
      console.log("ANSER = " + answer.sdp.match(/a=fingerprint:sha-256\s(.+)/)[1]);
          socketRef.current.emit('answer', answer, roomName);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  const handleAnswer = (answer) => {
      console.log("ANSER = " + answer.sdp.match(/a=fingerprint:sha-256\s(.+)/)[1]);
    rtcConnectionRef.current
      .setRemoteDescription(answer)
      .catch((err) => console.log(err));
  };

  const handleICECandidateEvent = (event) => {
    if (event.candidate) {
      socketRef.current.emit('ice-candidate', event.candidate, roomName);
    }
  };

  const handlerNewIceCandidateMsg = (incoming) => {
    // We cast the incoming candidate to RTCIceCandidate
    const candidate = new RTCIceCandidate(incoming);
    rtcConnectionRef.current
      .addIceCandidate(candidate)
      .catch((e) => console.log(e));
  };

  const handleTrackEvent = (event) => {
    // eslint-disable-next-line prefer-destructuring
    peerVideoRef.current.srcObject = event.streams[0];
  };

  const toggleMediaStream = (type, state) => {
    userStreamRef.current.getTracks().forEach((track) => {
      if (track.kind === type) {
        // eslint-disable-next-line no-param-reassign
        track.enabled = !state;
      }
    });
  };

  const toggleMic = () => {
    toggleMediaStream('audio', micActive);
    setMicActive((prev) => !prev);
  };

  const toggleCamera = () => {
    toggleMediaStream('video', cameraActive);
    setCameraActive((prev) => !prev);
  };

  const leaveRoom = () => {
    socketRef.current.emit('leave', roomName); // Let's the server know that user has left the room.

    if (userVideoRef.current.srcObject) {
      userVideoRef.current.srcObject.getTracks().forEach((track) => track.stop()); // Stops receiving all track of User.
    }
    if (peerVideoRef.current.srcObject) {
      peerVideoRef.current.srcObject
        .getTracks()
        .forEach((track) => track.stop()); // Stops receiving audio track of Peer.
    }

    // Checks if there is peer on the other side and safely closes the existing connection established with the peer.
    if (rtcConnectionRef.current) {
      rtcConnectionRef.current.ontrack = null;
      rtcConnectionRef.current.onicecandidate = null;
      rtcConnectionRef.current.close();
      rtcConnectionRef.current = null;
    }
    router.push('/')
  };

 

async function captureScreen() {
  let mediaStream = null;
  try {
      mediaStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
              cursor: "always"
          },
          audio: true
      });

      document.getElementById("screen-share").srcObject = mediaStream;
      document.getElementById("screen-share").onloadedmetadata = () => {
      document.getElementById("screen-share").play();
     
      };
  } catch (ex) {
      console.log("Error occurred", ex);
  }
}

  return (

<div className="flex flex-col items-center">
  <div className="flex flex-row justify-center w-full mb-8">
    <div className="relative">
      <video  className="w-full h-full object-cover border rounded-lg shadow-md" autoPlay ref={userVideoRef} />
       <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center">
        {cameraActive ? null: <FaVideoSlash className="text-white text-2xl" />}
      </div>
    </div>
    <div className="relative">
      <video className="w-full h-full object-cover border rounded-lg shadow-md" autoPlay ref={peerVideoRef} />
      <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center">
        {cameraActive ? null: <FaVideoSlash className="text-white text-2xl" />}
      </div>
    </div>
  </div>
  <video id="screen-share" muted autoplay></video>
  <div className="flex flex-row justify-center">
    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-l-lg mx-2" onClick={toggleMic} type="button">
      {micActive ? <FaMicrophone /> : <FaMicrophoneSlash />}
    </button>
    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mx-2" onClick={toggleCamera} type="button">
      {cameraActive ? <FaVideo /> : <FaVideoSlash />}
    </button>
    <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-r-lg mx-2" onClick={leaveRoom} type="button">
      <FaPhone />
    </button>
   
    <button onClick={captureScreen} >Capture</button>
    
  </div>

</div>





  );
};
