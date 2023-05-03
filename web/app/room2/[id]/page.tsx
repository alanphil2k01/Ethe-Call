'use client';

import { ChangeEventHandler, useContext, useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from '@/types/socket';
import MyVideoComponent from "@/components/MyVideoComponent";
import ChatComponent from "@/components/ChatComponent";
import { Blockchain } from "@/app/blockchain";
import { Fingerprint }  from "@/app/fingerprint";
import { useRouter } from "next/navigation";
import { Peer } from "@/app/peer";
import styles from './page.module.css';
//import  IconComponent  from './IconComponent';
import Image from 'next/image';
import camera from "../../../../src/camera.png";
import mic from "../../../../src/mic.png";
import phone from "../../../../src/phone.png";
import invite from "../../../../src/invite.png";

type DeviceInfo = {
    id: string,
    label: string
}

const defaultVidStreamConstraints = {
    audio: true,
    video: true
}

const defaultScreenCaptureContraints = {
    video: {
        displaySurface: "browser"
    } as MediaTrackSettings,
    audio: true
}

function useMediaDevices() {
    const userStreamRef = useRef<MediaStream>(null);
    const userScreenCapture = useRef<MediaStream>(null);

    const [isLoadingStream, setIsLoadingStream] = useState(false);

    const audioInList = useRef<DeviceInfo[]>([]);
    const [audioIn, setAudioIn] = useState<string>("");

    const audioOutList = useRef<DeviceInfo[]>([]);
    const [audioOut, setAudioOut] = useState<string>("");

    const cameraList = useRef<DeviceInfo[]>([]);
    const [camera, setCamera] = useState<string>("");

    const vidStreamConstraints = useRef<MediaStreamConstraints>(defaultVidStreamConstraints)
    const screenCaptureContraints = useRef<MediaStreamConstraints>(defaultScreenCaptureContraints);

    useEffect(() => {
        setIsLoadingStream(true)
        initMediaDevices().then(() => {
            setIsLoadingStream(false);
        });
        return () => {
            if (userStreamRef.current) {
                userStreamRef.current.getTracks().forEach(track => track.stop());
            }
        }
    }, []);

    useEffect(() => {
        const prevConstrains = vidStreamConstraints.current;
        getUserConstraints(audioIn, camera);
        if (vidStreamConstraints.current === prevConstrains) {
            return;
        }

        setIsLoadingStream(true)
        getUserStream().then(() => {
            setIsLoadingStream(false);
        });

        return () => {
            if (userStreamRef.current) {
                userStreamRef.current.getTracks().forEach(track => track.stop());
            }
        }
    }, [audioIn, camera]);

    function getUserConstraints(audioIn: string, camera: string) {
        if (!audioIn && !camera) {
            vidStreamConstraints.current = defaultVidStreamConstraints;
        } else {
            vidStreamConstraints.current = {
                audio: {deviceId: audioIn ? {exact: audioIn} : undefined},
                video: {deviceId: camera ? {exact: camera} : undefined}
            };
        }
    }

    async function initMediaDevices() {
        const deviceInfos = await navigator.mediaDevices.enumerateDevices()
        audioInList.current = [];
        audioOutList.current = [];
        cameraList.current = [];

        for (var i in deviceInfos) {
            const deviceInfo = deviceInfos[i];
            let device: DeviceInfo = { id: "", label: "" };
            device.id = deviceInfo.deviceId;
            if (deviceInfo.kind === 'audioinput') {
                device.label = deviceInfo.label || `microphone ${audioInList.current.length + 1}`;
                audioInList.current.push(device);
            } else if (deviceInfo.kind === 'audiooutput') {
                device.label = deviceInfo.label || `speaker ${audioOutList.current.length + 1}`;
                audioOutList.current.push(device);
            } else if (deviceInfo.kind === 'videoinput') {
                device.label = deviceInfo.label || `camera ${cameraList.current.length + 1}`
                cameraList.current.push(device);
            } else {
                console.log('Unknown source/device: ', deviceInfo);
            }
        }

        setAudioIn(audioInList.current[0]?.id);
        setAudioOut(audioOutList.current[0]?.id);
        setCamera(cameraList.current[0]?.id);

        getUserConstraints(audioInList.current[0]?.id, cameraList.current[0]?.id);
        await getUserStream()
    }

    function changeAudioOut(videoElement: any) {
        if (typeof videoElement.sinkId !== 'undefined') {
            videoElement.setSinkId(audioOut)
            .then(() => {
                console.log(`Success, audio output device attached: ${audioOut}`);
            })
        } else {
            console.warn('Browser does not support output device selection.');
        }
    }

    async function getUserStream() {
        try {
            userStreamRef.current = await navigator.mediaDevices.getUserMedia(vidStreamConstraints.current)
            //vidStreamConstraints = {audio: true, video: true}
        } catch (err) {
            console.log(err);
        }
    }

    async function initScreenCapture() {
        try {
            userScreenCapture.current = await navigator.mediaDevices.getDisplayMedia(screenCaptureContraints.current)
        } catch (err) {
            console.log(err);
        }
    }

    function test_media_dev() {
        console.log("Audio in List: ", audioInList.current);
        console.log("Audio out List: ", audioOutList.current);
        console.log("Camera List: ", cameraList.current);

        console.log("Selected Audio in: ", audioIn)
        console.log("Selected Audio out: ", audioOut)
        console.log("Selected Camera: ", camera)
    }

    return {
        initMediaDevices,
        isLoadingStream,
        userStreamRef,
        userScreenCapture,
        initScreenCapture,
        audioInList,
        setAudioIn,
        audioOutList,
        changeAudioOut,
        setCamera,
        test_media_dev,
        cameraList
    };
}

function DeviceList({ deviceList, onChange}: { deviceList: DeviceInfo[], onChange?: ChangeEventHandler<HTMLSelectElement> }) {
    return (
        <select onChange={onChange}>
            { deviceList.map((x) => <option key={x.id} value={x.id}>{x.label}</option>) }
        </select>
    )
}

const Room = ({ params }) => {
    const [peers, setPeers] = useState<Peer[]>([]);
    const userVideoRef = useRef<HTMLVideoElement>();
    const peersRef = useRef<{ peerSocketID: string, peer: Peer }[]>([]);
    const { id: roomID } = params;
    const socketCreated = useRef(false)
    const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents>>();
    const addr = useRef<string>((Math.random() + 1).toString(36).substring(5));
    const [chatMsgs, setChatMsgs] = useState<string[]>([]);
    const chatInputRef = useRef<HTMLInputElement>()

    const {
        isLoadingStream,
        userStreamRef,
        audioInList,
        audioOutList,
        cameraList,
        setAudioIn,
        setCamera,
    } = useMediaDevices();

    const router = useRouter();
    const { certificates } = useContext(Fingerprint);
    const { loadedWeb3, signer, roomExists, isAdmitted } = useContext(Blockchain);

    function getSocket(url: string) {
        console.log("connecting to ", url);
        socketRef.current = io(url)
        socketCreated.current = true
        console.log("Joining Room");
        socketRef.current.emit("join room", { roomID, addr: addr.current });
        socketRef.current.on("all users", (users) => {
            console.log("Received all users: ", users);
            const peers = [];
            users.forEach(user => {
                const peer = createPeer(user.socketID, socketRef.current.id);
                peersRef.current.push({
                    peerSocketID: user.socketID,
                    peer,
                })
                peers.push(peer);
            })
            setPeers(peers);
        })
        socketRef.current.on("user joined", ({ offer, fromUserID, }) => {
            console.log("user joined");
            const peer = addPeer(offer, fromUserID, userStreamRef.current);

            peersRef.current.push({
                peerSocketID: fromUserID,
                peer,
            })

            setPeers(users => [...users, peer]);
        });
        socketRef.current.on("receiving returned answer", ({ returnID, answer }) => {
            const p = peersRef.current.find(p => p.peerSocketID === returnID);
            console.log("Receiving returned answer");
            p.peer.setRemoteSDP(answer);
        });
        socketRef.current.on("ice candidate", ({ candidate, fromID }) => {
            const peer = peersRef.current.find(peer => peer.peerSocketID === fromID);
            peer.peer.pc
                .addIceCandidate(new RTCIceCandidate(candidate))
                .catch((e) => console.log(e));
        });
    }

    useEffect(() => {
        if (!loadedWeb3) {
            alert("Please connect your Meteamask Wallet");
            router.push("/");
            return;
        }
        roomExists(roomID).then((val) => {
            if (!val) {
                alert("Room ID does not exist");
                router.push("/");
            }
        });
        isAdmitted(roomID, signer.address).then((val) => {
            if (!val) {
                alert("You are not admitted to this room");
                router.push("/");
            }
        });
        if (!certificates) {
            alert("Please generate a certificate");
            router.push("/profile");
            return;
        }
        if (userStreamRef.current && !isLoadingStream) {
            userVideoRef.current.srcObject = userStreamRef.current;
            userVideoRef.current.onloadedmetadata = () => {
                userVideoRef.current.play();
            };
        }
        if (!userStreamRef.current || socketCreated.current) {
            return;
        }
        fetch("/api/socket2")
        .then(() => {
                // getSocket(process.env.WEBSOCKET_URL || '/api/socket');
                getSocket("");
        });

    }, [isLoadingStream]);

    function dcMessageHandler(event: MessageEvent) {
        const msg = event.data;
        setChatMsgs(prevChats => [...prevChats, msg]);
    }

    function createPeer(toUserID: string, fromUserID: string) {
        const peer = new Peer({
            addr: socketRef.current.id,
            stream: userStreamRef.current,
            initiator: true,
            certificates: certificates,
            dcMessageHandler: dcMessageHandler
        });
        peer.pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit("ice candidate", { candidate: event.candidate, roomID, fromID: socketRef.current.id });
            }
        }
        peer.createSDP()
        .then((offer) => {
            socketRef.current.emit("send offer", { toUserID, fromUserID, offer })
        });
        peer.pc.ontrack = (event) => {
            console.log("Got Tracks: ", event.streams[0].getTracks());
            const index = peersRef.current.findIndex(p => p.peer === peer)
            if (index === -1) {
                return;
            }
            peersRef.current[index].peer.remoteStream = event.streams[0];
            const peers = peersRef.current.map((x) => x.peer);
            setPeers(peers);
        };
        return peer;
    }

    function addPeer(offer: RTCSessionDescription, callerID: string, stream: MediaStream): Peer {
        const peer = new Peer({
            initiator: false,
            addr: callerID,
            stream,
            certificates: certificates,
            dcMessageHandler: dcMessageHandler
        })
        peer.pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit("ice candidate", { candidate: event.candidate, roomID, fromID: socketRef.current.id });
            }
        }
        peer.pc.ontrack = (event) => {
            console.log("Got Tracks: ", event.streams[0].getTracks());
            const index = peersRef.current.findIndex(p => p.peer === peer)
            if (index === -1) {
                return;
            }
            peersRef.current[index].peer.remoteStream = event.streams[0];
            const peers = peersRef.current.map((x) => x.peer);
            setPeers(peers);
        };
        peer.setRemoteSDP(offer)
        .then((answer) => {
                console.log("returning answer");
                socketRef.current.emit("return answer", { answer, callerID })
        })
        return peer;
    }

    function sendChatMsg() {
        const val = chatInputRef.current.value;
        peers.forEach(peer => {
            if (peer.dcReady) {
                peer.dc.send(`${val} from ${socketRef.current.id}`);
            } else {
                console.log("Peer dc is not ready");
            }
        })
        chatInputRef.current.value = "";
        setChatMsgs(prevChats => [...prevChats, `you sent ${val}`]);
}

    return (
        <div>
            <div className="h-5 bg-white"></div>
            {/*
            <button onClick={() => {
                peersRef.current.forEach(peer => {
                    console.log("Connecttion State: ", peer.peer.pc.connectionState);
                    console.log("Ice Connection State: ", peer.peer.pc.iceConnectionState);
                    console.log("Signalling State: ", peer.peer.pc.signalingState);
                    console.log("Can Trickle: ", peer.peer.pc.canTrickleIceCandidates);
                })
            }} >Check Status</button>
        */}

            <MyVideoComponent stream={userVideoRef} peers={peers} />
            <div className={`${styles.controls}`}>
                <div className={`${styles.controlContainer} ${styles.cameraBtn}`} onClick={()=>peers.forEach((peer)=>{peer.toggleCamera()})}>
                    <Image src={camera} alt="camera" className={`${styles.imgCamera} ${styles.images}`}/>
                </div>
                <div className={`${styles.controlContainer} ${styles.micBtn}`} onClick={()=>peers.forEach((peer)=>{peer.toggleMic()})}>
                    <Image src={mic} alt="mic" className={`${styles.imgMic} ${styles.images}`}/>
                </div>
                <div className={`${styles.controlContainer} ${styles.leaveBtn}`}>
                    <a href="/">
                        <Image src={phone} alt="phone" className={`${styles.imgPhone} ${styles.images}`}/>
                    </a>
                </div>
            </div>
            <DeviceList deviceList={audioInList.current} onChange={(e) => {setAudioIn(e.target.value)}} />
            <DeviceList deviceList={audioOutList.current} />
            <DeviceList deviceList={cameraList.current} onChange={(e) => {setCamera(e.target.value)}} />
            <ChatComponent msgs={chatMsgs} chatInputRef={chatInputRef} sendChatMsg={sendChatMsg} />
        </div>
    );
};

export default Room;
