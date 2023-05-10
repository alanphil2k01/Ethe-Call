"use client";

import { MutableRefObject, useEffect, useRef } from "react";
import { Peer } from "@/app/peer";
import styles from "./MyVideoComponent.module.css";

function PeerVideo ({ stream }: { stream: MediaStream }) {
    const peerVidRef = useRef<HTMLVideoElement>();

    useEffect(() => {
        peerVidRef.current.srcObject = stream;
    }, [stream]);

    return (
        // <div>
        //     <video autoPlay className="bg-red h-160 w-160" ref={peerVidRef} />
        // </div>
      <div className={`${styles.video__container}`}>
        <div className={`${styles.video__player}`}>
            <video autoPlay ref={peerVidRef} />
          </div>
        </div>
    );
}

const MyVideoComponent = ({ stream, peers }: { stream: MutableRefObject<HTMLVideoElement>, peers: Peer[]}) => {
  return (
    <div id={`${styles.streams__container}`}>
      <div className={`${styles.video__container}`}>
        <div className={`${styles.video__player}`}>
          <video autoPlay muted className="h-80 w-80 bg-blue" ref={stream} />
        </div>
      </div>
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