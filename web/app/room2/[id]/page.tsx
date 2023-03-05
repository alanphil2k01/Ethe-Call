'use client';

import React, { ChangeEventHandler, useEffect, useRef, useState } from "react";
import useMediaDevices, { DeviceInfo } from "@/hooks/useMediaDevices";
import { Peer } from "@/hooks/useWebRTC";
import useRTCCertificate from "@/hooks/useRTCCertificates";
import io, { Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from '@/types/socket';

const Video = ({ pc }: { pc: RTCPeerConnection }) => {
    const peerVidRef = useRef<HTMLVideoElement>();

    useEffect(() => {
        pc.ontrack = (event) => {
            console.log("got tracks");
            peerVidRef.current.srcObject = event.streams[0];
        }
    }, []);

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


    useEffect(() => {
        if (!userStreamRef.current || isLoadingStream) {
            return;
        }

        userVideoRef.current.srcObject = userStreamRef.current;
        userVideoRef.current.onloadedmetadata = () => {
            userVideoRef.current.play();
        };

        if (socketCreated.current) {
            return;
        }

        fetch("/api/socket2").then(() => {
            socketRef.current = io()
            socketCreated.current = true
        }).then(() => {
            console.log("ping");
            socketRef.current.emit("ping");
            socketRef.current.on("pong", () => { console.log("pong") });

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
                console.log("recevied ice candidate from: ", fromID);
                const peer = peersRef.current.find(peer => peer.peerSocketID === fromID);
                peer.peer.pc
                    .addIceCandidate(new RTCIceCandidate(candidate))
                    .catch((e) => console.log(e));
            });
        });

    }, [isLoadingStream]);


    function createPeer(toUserID: string, fromUserID: string) {
        console.log("Initiating Connection to: ", toUserID);
        const peer = new Peer({
            addr: socketRef.current.id,
            stream: userStreamRef.current,
            initiator: true,
            certificates: certificates.current,
        });

        peer.pc.onicecandidate = (e) => {
            handlICEEvent(e.candidate);
        }

            peer.createSDP()
                .then((offer) => {
                        socketRef.current.emit("send offer", { toUserID, fromUserID, offer })
                });

        return peer;
    }

    function handleMessage(e: MessageEvent) {
        console.log(e.data);
    }

    function addPeer(offer: RTCSessionDescription, callerID: string, stream: MediaStream): Peer {
        console.log("Accepting Connection from: ", callerID);
        const peer = new Peer({
            initiator: false,
            addr: callerID,
            stream,
            certificates: certificates.current,
        })
        peer.pc.onicecandidate = (e) => {
            handlICEEvent(e.candidate);
        }

        peer.setRemoteSDP(offer)
            .then((answer) => {
                    console.log("return answer");
                    socketRef.current.emit("return answer", { answer, callerID })
            })

        return peer;

    }

    function handlICEEvent (candidate: RTCIceCandidate)  {
        if (candidate) {
            socketRef.current.emit("ice candidate", { candidate, roomID, fromID: socketRef.current.id });
        }
    };

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
        <video autoPlay className="h-80 w-80 bg-black" ref={userVideoRef} />
        {peers.map((peer, index) => {
            return (
                <div key={index}>
                    <Video pc={peer.pc} />
                </div>
            );
        })}
        </div>
    );
};
          // <DeviceList deviceList={audioInList.current} onChange={(e) => {setAudioIn(e.target.value)}} />
          // <DeviceList deviceList={audioOutList.current} />
          // <DeviceList deviceList={cameraList.current} onChange={(e) => {setCamera(e.target.value)}} />

export default Room;
