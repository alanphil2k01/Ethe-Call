"use client";

import { ChangeEventHandler, useContext, useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents, UserData } from '@/types/socket';
import MyVideoComponent from "@/components/MyVideoComponent";
import Chat from "@/components/Chat";
import Stream from "@/components/Stream";
import Members from "@/components/Members";
// import ChatComponent from "@/components/ChatComponent";
import { Blockchain, verifySign } from "@/app/blockchain";
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
import Link from "next/link";

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
    const peersRef = useRef<Peer[]>([]);
    const { id: roomID } = params;
    const socketCreated = useRef(false)
    const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents>>();
    const userData = useRef<UserData>(null);
    const [chatMsgs, setChatMsgs] = useState<string[]>([]);
    const chatInputRef = useRef<HTMLInputElement>()
    const [camEnabled, setCamEnabled] = useState(true);
    const [micEnabled, setMicEnabled] = useState(true);

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
    const { loadedWeb3, signer, message, sign, displayName, roomExists, isAdmitted } = useContext(Blockchain);

    function getSocket(url: string) {
        socketRef.current = io(url)
        socketCreated.current = true
        console.log("Joining Room");
        socketRef.current.emit("join room", roomID, userData.current);
        socketRef.current.on("all users", (users) => {
            console.log("Received all users: ", users);
            users.forEach((peerData) => {
                const peer = createPeer(peerData);
                peersRef.current.push(peer);
            })
            setPeers([...peersRef.current]);
        })
        socketRef.current.on("user joined", (offer, peerData) => {
            console.log("user joined");
            const peer = addPeer(offer, peerData, userStreamRef.current);

            peersRef.current.push(peer)

            setPeers(users => [...users, peer]);
        });
        socketRef.current.on("receiving returned answer", (answer, returnAddr) => {
            const peer = peersRef.current.find((peer) => peer.peerData.address === returnAddr);
            console.log("Receiving returned answer");
            peer.setRemoteSDP(answer);
        });
        socketRef.current.on("ice candidate", (candidate, fromAddr) => {
            const peer = peersRef.current.find((peer) => peer.peerData.address === fromAddr);
            peer.pc
                .addIceCandidate(new RTCIceCandidate(candidate))
                .catch((e) => console.log(e));
        });
    }

    function verifyUser() {
        if (!loadedWeb3) {
            alert("Please connect your Metamask Wallet");
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
    }

    async function initUserData() {
        console.log("Logged in as " + signer.address);
        userData.current = {
            address: signer.address,
            nickname: displayName,
            message: message,
            sign: sign,
        }
    }

    useEffect(() => {
        //verifyUser();
        initUserData().then(() => {
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
                    getSocket("");
            });
        });

    }, [isLoadingStream]);

    function iceHandler(event: RTCPeerConnectionIceEvent) {
        if (event.candidate) {
            socketRef.current.emit("ice candidate", event.candidate);
        }
    }

    function dcMessageHandler(event: MessageEvent) {
        const msg = event.data;
        setChatMsgs(prevChats => [...prevChats, msg]);
    }

    function createPeer(peerData: UserData) {
        const peer = new Peer({
            stream: userStreamRef.current,
            initiator: true,
            certificates,
            peerData,
            iceHandler,
            dcMessageHandler,
        });
        peer.createSDP()
        .then((offer) => {
            socketRef.current.emit("send offer", offer, peerData.address)
        });
        peer.pc.ontrack = (event) => {
            console.log("Got Tracks: ", event.streams[0].getTracks());
            const index = peersRef.current.findIndex(p => p === peer)
            if (index === -1) {
                return;
            }
            peersRef.current[index].remoteStream = event.streams[0];
            setPeers([...peersRef.current]);
        };
        return peer;
    }

    function addPeer(offer: RTCSessionDescription, peerData: UserData, stream: MediaStream): Peer {
        const peer = new Peer({
            initiator: false,
            stream,
            certificates,
            iceHandler,
            dcMessageHandler,
            peerData,
        })
        peer.pc.ontrack = (event) => {
            console.log("Got Tracks: ", event.streams[0].getTracks());
            const index = peersRef.current.findIndex(p => p === peer)
            if (index === -1) {
                return;
            }
            peersRef.current[index].remoteStream = event.streams[0];
            setPeers([...peersRef.current]);
        };
        peer.setRemoteSDP(offer)
        .then((answer) => {
            console.log("returning answer");
            socketRef.current.emit("return answer", answer, peerData.address)
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
        <main className={`${styles.container}`}>
            <div className={`${styles.room__container}`}>
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
                <section className={`${styles.members__container}`}>
                    <Members></Members>
                </section>
                <section className={`${styles.stream__container}`}>
                    {/* <MyVideoComponent stream={userVideoRef} peers={peers} /> */}

                    {/* <div className={`${styles.controls}`}>
                        <div className={`${styles.controlContainer} ${styles.cameraBtn}`} onClick={()=>peers.forEach((peer)=>{peer.toggleCamera()})}>
                            <Image src={camera} alt="camera" className={`${styles.imgCamera} ${styles.images}`}/>
                        </div>
                        <div className={`${styles.controlContainer} ${styles.micBtn}`} onClick={()=>peers.forEach((peer)=>{peer.toggleMic()})}>
                            <Image src={mic} alt="mic" className={`${styles.imgMic} ${styles.images}`}/>
                        </div>
                        <div className={`${styles.controlContainer} ${styles.leaveBtn}`}>
                            <Link href="/">
                                <Image src={phone} alt="phone" className={`${styles.imgPhone} ${styles.images}`}/>
                            </Link>
                        </div>
                    </div> */}
                    <Stream></Stream>
                    {/* <DeviceList deviceList={audioInList.current} onChange={(e) => {setAudioIn(e.target.value)}} />
                    <DeviceList deviceList={audioOutList.current} />
                    <DeviceList deviceList={cameraList.current} onChange={(e) => {setCamera(e.target.value)}} /> */}
                </section>
                <section className={`${styles.messages__container}`}>
                    <Chat msgs={chatMsgs} chatInputRef={chatInputRef} sendChatMsg={sendChatMsg} />
                </section>
        {/* <div>
            <div className="h-5"></div>
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
        {/*
            <MyVideoComponent stream={userVideoRef} peers={peers} />
            <div className={`${styles.controls}`}>
                <div className={`${styles.controlContainer} ${styles.cameraBtn}`} onClick={() => {
                    // peers.forEach((peer)=>{peer.toggleCamera()})
                    userStreamRef.current.getTracks().find(track => track.kind === "video").enabled = !camEnabled;
                    setCamEnabled(!camEnabled);
                }}>
                    <Image src={camera} alt="camera" className={`${styles.imgCamera} ${styles.images}`}/>
                </div>
                <div className={`${styles.controlContainer} ${styles.micBtn}`} onClick={() => {
                    // peers.forEach((peer)=>{peer.toggleMic()})
                    userStreamRef.current.getTracks().find(track => track.kind === "audio").enabled = !micEnabled;
                    setMicEnabled(!micEnabled);
                }}>
                    <Image src={mic} alt="mic" className={`${styles.imgMic} ${styles.images}`}/>
                </div>
                <div className={`${styles.controlContainer} ${styles.leaveBtn}`}>
                    <Link onClick={() => socketRef.current.disconnect()} href="/">
                        <Image src={phone} alt="phone" className={`${styles.imgPhone} ${styles.images}`}/>
                    </Link>
                </div>
            </div> */}
        </div>
        </main>
    );
};

export default Room;