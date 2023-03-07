'use client';

import { ChangeEventHandler, useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from '@/types/socket';

type DeviceInfo = {
    id: string,
    label: string
}

type Options = {
    certificates?: RTCCertificate[];
    stream?: MediaStream;
    initiator?: boolean;
    addr: string,
}

const ICE_SERVERS = [
    {
        urls: 'stun:openrelay.metered.ca:80',
    }
]

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

class Peer {
    pc: RTCPeerConnection;
    dc: RTCDataChannel;
    addr: string;
    certificates: RTCCertificate[];
    userStream: MediaStream;
    initiator?: boolean;
    dcReady: boolean = false;
    remoteStream: MediaStream;

    constructor(opts: Options) {
        this.addr = opts.addr;
        this.certificates = opts.certificates;
        this.userStream = opts.stream;
        this.initiator = opts.initiator || false;

        this.pc = new RTCPeerConnection({
            iceServers: ICE_SERVERS,
            certificates: this.certificates,
        })

        if (this.initiator) {
            this.dc = this.pc.createDataChannel(`chat ${this.addr}`);
            this.dc.onmessage = this.dcMessageHandler;
            this.dc.onopen = () => {
                if (this.dc.readyState === "open") {
                    this.dcReady = true;
                }
            }
        } else {
            this.pc.ondatachannel = (event) => {
                this.dc = event.channel;
                this.dc.onmessage = this.dcMessageHandler;
                this.dc.onopen = () => {
                    if (this.dc.readyState === "open") {
                        this.dcReady = true;
                    }
                }
            }
        }

    }

    addTracks() {
        if (this.userStream) {
            this.userStream.getTracks().forEach((track) => {
                    this.pc.addTrack(track, this.userStream);
                    });
        }
    }

    dcMessageHandler(event: MessageEvent) {
        console.log(event.data);
    }

    async createSDP(): Promise<RTCSessionDescription> {
        if (!this.initiator) {
            return;
        }
        this.addTracks();

        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        return this.pc.localDescription;

    }

    async setRemoteSDP(sdp: RTCSessionDescription): Promise<RTCSessionDescription | null> {
        this.pc.setRemoteDescription(sdp);

        if (this.initiator) {
            return;
        }

        this.addTracks();
        let answer: RTCSessionDescription;
        await this.pc.createAnswer()
        .then((answerSDP) => {
            answer = new RTCSessionDescription(answerSDP);
            this.pc.setLocalDescription(answer);
        })
       return answer;
    }
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

function useRTCCertificate() {
    const certificates = useRef<RTCCertificate[]>([])
    const config = {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
    };
    useEffect(() => {
        RTCPeerConnection.generateCertificate(config)
            .then((cert) => {
                certificates.current = [cert];
            });
    }, []);

    return { certificates };
}

function Video ({ stream }: { stream: MediaStream }) {
    const peerVidRef = useRef<HTMLVideoElement>();

    useEffect(() => {
        peerVidRef.current.srcObject = stream;
    }, [stream]);

    return (
        <div>
            <video autoPlay controls className="bg-black h-80 w-80" ref={peerVidRef} />
        </div>
    );
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

    const {
        isLoadingStream,
        userStreamRef,
        audioInList,
        audioOutList,
        cameraList,
        setAudioIn,
        setCamera,
    } = useMediaDevices();

    const { certificates } = useRTCCertificate();

    function getSocket() {
        console.log("connecting to ", process.env.WEBSOCKET_URL || 'api/sockt');
        socketRef.current = io(process.env.WEBSOCKET_URL || '/api/socket')
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
        if (userStreamRef.current && !isLoadingStream) {
            userVideoRef.current.srcObject = userStreamRef.current;
            userVideoRef.current.onloadedmetadata = () => {
                userVideoRef.current.play();
            };
        }
        if (!userStreamRef.current || socketCreated.current) {
            return;
        }
        // fetch("http://34.123.244.52/api/socket2")
        // .then(() => {
        // }).then(() => {
        // });
        getSocket();

    }, [isLoadingStream]);


    function createPeer(toUserID: string, fromUserID: string) {
        const peer = new Peer({
            addr: socketRef.current.id,
            stream: userStreamRef.current,
            initiator: true,
            certificates: certificates.current,
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
            certificates: certificates.current,
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

    return (
        <div>
            <div className="h-5 bg-white"></div>
            <button onClick={() => {
            peers.forEach(peer => {
                    if (peer.dcReady) {
                    peer.dc.send(`hello from ${socketRef.current.id}`);
                    } else {
                    console.log("Peer dc is not ready");
                    }
                    })
            }}>Send Message</button>

            <button onClick={() => {
                peersRef.current.forEach(peer => {
                    console.log("Connecttion State: ", peer.peer.pc.connectionState);
                    console.log("Ice Connection State: ", peer.peer.pc.iceConnectionState);
                    console.log("Signalling State: ", peer.peer.pc.signalingState);
                    console.log("Can Trickle: ", peer.peer.pc.canTrickleIceCandidates);
                })
            }} >Check Status</button>

            <video autoPlay muted className="h-80 w-80 bg-black" ref={userVideoRef} />

            {peers.map((peer, index) => {
                    return (
                            <div key={index}>
                            <Video stream={peer.remoteStream} />
                            </div>
                           );
                    })}

            <DeviceList deviceList={audioInList.current} onChange={(e) => {setAudioIn(e.target.value)}} />
            <DeviceList deviceList={audioOutList.current} />
            <DeviceList deviceList={cameraList.current} onChange={(e) => {setCamera(e.target.value)}} />
        </div>
    );
};

export default Room;
