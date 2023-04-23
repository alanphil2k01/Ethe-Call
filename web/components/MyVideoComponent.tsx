"use client";

import { MutableRefObject, useEffect, useRef } from "react";
import { Peer } from "@/app/peer";

function PeerVideo ({ stream }: { stream: MediaStream }) {
    const peerVidRef = useRef<HTMLVideoElement>();

    useEffect(() => {
        peerVidRef.current.srcObject = stream;
    }, [stream]);

    return (
        <div>
            <video autoPlay className="bg-black h-80 w-80" ref={peerVidRef} />
        </div>
    );
}

const MyVideoComponent = ({ stream, peers }: { stream: MutableRefObject<HTMLVideoElement>, peers: Peer[]}) => {
  return (
    <div>
      <video autoPlay muted className="h-80 w-80 bg-black" ref={stream} />
      {peers && peers.map((peer, index) => {
        return (
          <div key={index}>
            <PeerVideo stream={peer.remoteStream} />
          </div>
        );
      })}
    </div>
  );
};

export default MyVideoComponent;
