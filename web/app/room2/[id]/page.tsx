"use client";

import { ChangeEventHandler, useContext, useEffect, useRef, useState, DragEvent } from "react";
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
import useFileUpload from "@/hooks/FileUpload";
import { MessageType, MessageContent } from "@/types/message";
import { useMediaDevices, DeviceInfo } from "@/hooks/MediaDevices";
import { toast } from "react-toastify";

function DeviceList({ deviceList, onChange}: { deviceList: DeviceInfo[], onChange?: ChangeEventHandler<HTMLSelectElement> }) {
    return (
        <select className="text-black" onChange={onChange}>
            { deviceList.map((x) => <option key={x.id} value={x.id}>{x.label}</option>) }
        </select>
    )
}

const Room = ({ params }) => {
    const [peers, setPeers] = useState<Peer[]>([]);
    const peersRef = useRef<Peer[]>([]);
    const { id: roomID } = params;
    const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents>>(null);
    const userData = useRef<UserData>(null);
    const [chatMsgs, setChatMsgs] = useState<MessageContent[]>([]);
    const chatInputRef = useRef<HTMLInputElement>()
    const [camEnabled, setCamEnabled] = useState(false);
    const [micEnabled, setMicEnabled] = useState(false);
    const [screenSharing, setScreenSharing] = useState(false);
    const [focussedOn, setFocussedOn] = useState(-1);
    const isWindowDefined = typeof window !== 'undefined';
    const [showMembers, setShowMembers] = useState(isWindowDefined ? window.innerWidth >= 1200 : false);
    const [showChat, setShowChat] = useState(isWindowDefined ? window.innerWidth >= 1200 : false);

    const { uploadFiles } = useFileUpload();

    const {
        userStream,
        camTrack,
        loadedStream,
        startScreenShare,
        stopScreenShare,
        cameraList,
        audioInList,
        audioOutList,
        setAudioIn,
        setCamera,
        tracksChanged,
        setTracksChanged,
    } = useMediaDevices();

    const router = useRouter();
    const { certificates } = useContext(Fingerprint);
    const { loadedWeb3, signer, message, sign,  displayName, roomExists, isAdmitted, verifyPeer } = useContext(Blockchain);

    function getSocket(url: string) {
        socketRef.current = io(url)
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
            const peer = addPeer(offer, peerData, userStream.current);
            peersRef.current.push(peer)
            setPeers(users => [...users, peer]);
        });
        socketRef.current.on("receiving returned answer", (answer, returnAddr) => {
            const peer = peersRef.current.find((peer) => peer.peerData.address === returnAddr);
            verifyPeer(answer, peer.peerData).then((validUser) => {
                if (!validUser) {
                    peer.pc.close();
                }
            });
            console.log("Receiving returned answer");
            peer.setRemoteSDP(answer);
        });
        socketRef.current.on("ice candidate", (candidate, fromAddr) => {
            const peer = peersRef.current.find((peer) => peer.peerData.address === fromAddr);
            console.log("Received ice candidates");
            peer.pc
                .addIceCandidate(new RTCIceCandidate(candidate))
                .catch((e) => console.log(e));
        });
        socketRef.current.on("user disconnected", (addr) => {
            setFocussedOn(-1);
            peersRef.current = peersRef.current.filter((peer) => addr !== peer.peerData.address);
            setPeers([...peersRef.current]);
        });
    }

    function verifyUser() {
        if (!loadedWeb3) {
            toast.warn("Please connect your Metamask Wallet", { autoClose: 2500 });
            router.push("/");
            return;
        }
        roomExists(roomID).then((val) => {
            if (!val) {
                toast.warn("Room ID does not exist", { autoClose: 2500 });
                router.push("/");
                return;
            }
        });
        isAdmitted(roomID, signer.address).then((val) => {
            if (!val) {
                toast.warn("You are not admitted to this room", { autoClose: 2500 });
                router.push("/");
                return;
            }
        });
        if (!certificates) {
            toast.warn("Please generate a certificate", { autoClose: 2500 });
            router.push("/profile");
            return;
        }
    }

    function initUserData() {
        // const rando =(Math.random() + 1).toString(36).substring(7);
        userData.current = {
            address: signer.address,
            // address: rando,
            displayName,
            message: message,
            sign: sign,
        }
    }

    useEffect(() => {
        verifyUser();
        if (!loadedStream) {
            return;
        }
        initUserData();
        if (!socketRef.current) {
            fetch("/api/socket2")
            .then(() => {
                getSocket("");
            });
        }

    }, [loadedStream]);

    useEffect(() => {
        if (tracksChanged) {
            console.log("TRACKS");
            console.log(userStream.current.getTracks());
            console.log(userStream.current);
            userStream.current.getTracks().forEach((track) => {
                if (track.kind === "video") {
                    console.log("VIDEO " + track.enabled);
                    setCamEnabled(track.enabled);
                    return;
                }
                if (track.kind === "audio") {
                    console.log("AUDIO " + track.enabled);
                    setMicEnabled(track.enabled);
                    return;
                }
            });
            console.log("Updating Tracks");
            peersRef.current.forEach((peer) => peer.updateStream(userStream.current));
            setTracksChanged(false);
        }
    }, [tracksChanged]);

    function iceHandler(event: RTCPeerConnectionIceEvent) {
        if (event.candidate) {
            socketRef.current.emit("ice candidate", event.candidate);
        }
    }

    function dcMessageHandler(event: MessageEvent) {
        const msg = JSON.parse(event.data) as MessageContent;
        setChatMsgs(prevChats => [...prevChats, msg]);
    }

    function sendDcMsgToAllPeers(msg: MessageContent) {
        peers.forEach(peer => {
            if (peer.dcReady) {
                peer.dc.send(JSON.stringify(msg));
            } else {
                console.log("Peer dc is not ready");
            }
        })
        if (msg.type === MessageType.CHAT || msg.type === MessageType.FILE) {
            setChatMsgs(prevChats => [...prevChats, { ...msg, author: "you" }]);
        }
    }

    async function screenShareHandler() {
        if (!screenSharing) {
            await startScreenShare(() => setScreenSharing(false));
            setScreenSharing(true);
        } else {
            stopScreenShare();
            setScreenSharing(false);
        }
    }

    function createPeer(peerData: UserData) {
        const peer = new Peer({
            stream: userStream.current,
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

        verifyPeer(offer, peerData).then((validUser) => {
            if (!validUser) {
                peer.pc.close();
            }
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
        peer.setRemoteSDP(offer)
        .then((answer) => {
            console.log("returning answer");
            socketRef.current.emit("return answer", answer, peerData.address)
        })
        return peer;
    }

    function sendChatMsg() {
        const msg = chatInputRef.current.value;
        if (msg === "") {
            return;
        }
        sendDcMsgToAllPeers({ type: MessageType.CHAT, data: msg, author: displayName });
        chatInputRef.current.value = "";
    }

    /*for(let i = 0; videoFrames.length > i; i++){
        videoFrames[i].addEventListener('click', expandVideoFrame)
    }*/

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

                <section className={`${styles.members__container}`} style={showMembers ? {display: "block"} : {display: "none"}}>
                    <Members closeHandler={() => setShowMembers(false)} peers={peers}></Members>
                </section>

                <section className={`${styles.stream__container}`}>
                    {/*<div className={`${styles.stream__box}`}>
                        <MyVideoComponent stream={userVideoRef} peers={peers} />
                    </div>
                     <div className={`${styles.controls}`}>
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
                    <Stream
                        focussedOn={focussedOn}
                        setFocussedOn={setFocussedOn}
                        userStream={userStream}
                        peers={peers}
                        showMembersHandler={() => setShowMembers(prev => !prev)}
                        showChatHandler={() => setShowChat(prev => !prev)}
                        camEnabled={camEnabled}
                        micEnabled={micEnabled}
                        screenSharing={screenSharing}
                        cameraHandler={ () => {
                            if (camTrack.current) {
                                setCamEnabled((prev) => {
                                        camTrack.current.enabled = !prev;
                                        return !prev;
                                        });
                            }
                        }} audioHandler={ () => {
                            userStream.current.getTracks().forEach((track) => {
                                if (track.kind === "audio") {
                                    setMicEnabled((prev) => {
                                            track.enabled = !prev;
                                            return !prev;
                                    });
                                }
                            });
                        }} screenShareHandler={screenShareHandler} disconnectHandler={() => {
                            socketRef.current.disconnect();
                            router.push("/");
                        }}></Stream>
                        {/*
                        <DeviceList deviceList={cameraList.current} onChange={(e) => {setCamera(e.target.value)}} />
                    <DeviceList deviceList={audioInList.current} onChange={(e) => {setAudioIn(e.target.value)}} />
                    <DeviceList deviceList={audioOutList.current} />
                    */}
                </section>
                <section className={`${styles.messages__container}`} style={showChat ? {display: "block"} : {display: "none"}} >
                    <Chat closeHandler={() => setShowChat(false)} msgs={chatMsgs} chatInputRef={chatInputRef} sendChatMsg={sendChatMsg} sendFiles={(files: File[]) => {
                        if (files.length > 0) {
                            toast.promise(async () => {
                                const cid = await uploadFiles(files)
                                sendDcMsgToAllPeers({ type: MessageType.FILE, data: cid, author: displayName });
                            }, {
                                pending: "Uploading Files",
                                success: "Uploaded Files",
                                error: "Failed to Upload Files",
                            })
                        }
                    }} />
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
