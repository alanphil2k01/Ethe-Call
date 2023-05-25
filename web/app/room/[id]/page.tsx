"use client";

import { ChangeEventHandler, useContext, useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents, UserData } from 'common-types/socket';
import Chat from "@/components/Chat";
import Stream from "@/components/Stream";
import Members from "@/components/Members";
import { Blockchain } from "@/app/blockchain";
import { Fingerprint }  from "@/app/fingerprint";
import { useRouter } from "next/navigation";
import { Peer } from "@/app/peer";
import styles from './page.module.css';
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
    const focussedOnRef = useRef(-1);
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
                    if (focussedOnRef.current !== -1) {
                        if (peersRef.current[focussedOnRef.current].peerData.address === peer.peerData.address) {
                            setFocussedOn(-1);
                        } else if (focussedOnRef.current === peers.length - 1) {
                            setFocussedOn(focussedOnRef.current - 1);
                        }
                    }
                    peer.pc.close();
                    peersRef.current = peersRef.current.filter((p) => p !== peer);
                    setPeers([...peersRef.current]);
                }
            });
            console.log("Receiving returned answer");
            peer.setRemoteSDP(answer);
        });
        socketRef.current.on("ice candidate", (candidate, fromAddr) => {
            const peer = peersRef.current.find((peer) => peer.peerData.address === fromAddr);
            console.log("Received ice candidates");
            peer?.pc
                .addIceCandidate(new RTCIceCandidate(candidate))
                .catch((e) => console.log(e));
        });
        socketRef.current.on("user disconnected", (addr) => {
            if (focussedOnRef.current !== -1) {
                if (peersRef.current[focussedOnRef.current].peerData.address === addr) {
                    setFocussedOn(-1);
                } else if (focussedOnRef.current === peers.length - 1) {
                    setFocussedOn(focussedOnRef.current - 1);
                }
            }
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
        userData.current = {
            address: signer.address,
            displayName,
            message: message,
            sign: sign,
        }
    }

    useEffect(() => {
        verifyUser();
        if (!loadedStream || !loadedWeb3) {
            return;
        }
        initUserData();
        if (!socketRef.current) {
            getSocket(process.env.NEXT_PUBLIC_WS_URL || "");
        }

    }, [loadedStream]);

    useEffect (() => { focussedOnRef.current = focussedOn }, [focussedOn]);
    useEffect(() => {
        if (tracksChanged) {
            userStream.current.getTracks().forEach((track) => {
                if (track.kind === "video") {
                    setCamEnabled(track.enabled);
                    return;
                }
                if (track.kind === "audio") {
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
            const index = peersRef.current.findIndex(p => p === peer)
            if (index === -1) {
                return;
            }
            console.log("Got Tracks for peer: ", peersRef.current[index].peerData.displayName);
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
                if (focussedOnRef.current !== -1) {
                    if (peersRef.current[focussedOnRef.current].peerData.address === peer.peerData.address) {
                        setFocussedOn(-1);
                    } else if (focussedOnRef.current === peers.length - 1) {
                        setFocussedOn(focussedOnRef.current - 1);
                    }
                }
                peer.pc.close();
                peersRef.current = peersRef.current.filter((p) => p !== peer);
                setPeers([...peersRef.current]);
            }
        });

        peer.pc.ontrack = (event) => {
            const index = peersRef.current.findIndex(p => p === peer)
            if (index === -1) {
                return;
            }
            console.log("Got Tracks for peer: ", peersRef.current[index].peerData.displayName);
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

    return (
        <main className={`${styles.container}`}>
            <div className={`${styles.room__container}`}>

                <section className={`${styles.members__container}`} style={showMembers ? {display: "block"} : {display: "none"}}>
                    <Members closeHandler={() => setShowMembers(false)} peers={peers}></Members>
                </section>

                <section className={`${styles.stream__container}`}>
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
            </div>
        </main>
    );
};

export default Room;
