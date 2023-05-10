"use client";

import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef } from "react";
import { Peer } from "@/app/peer";
import styles from "./MyVideoComponent.module.css";

export function PeerVideo ({ stream, focussedOn, setFocussedOn, index }: { stream: MediaStream, focussedOn: number, setFocussedOn: Dispatch<SetStateAction<number>>, index:number }) {
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
            <video autoPlay onClick={()=>{setFocussedOn(index)}} ref={peerVidRef} />
        </div>
      </div>
    );
}

const MyVideoComponent = ({ stream, peers, focussedOn, setFocussedOn }: { stream: MutableRefObject<HTMLVideoElement>, peers: Peer[], focussedOn: number, setFocussedOn: Dispatch<SetStateAction<number>>}) => {
  return (
    <div id={`${styles.streams__container}`}>
      { focussedOn !== 1 && <div className={`${styles.video__container}`}>
        <div className={`${styles.video__player}`}>
          <video autoPlay onClick={()=>{setFocussedOn(-1)}} muted ref={stream} />
        </div>
      </div>}
        {peers && peers.map((peer, index) => {
          return index !== focussedOn && (
            <div key={index}>
              <PeerVideo stream={peer.remoteStream} focussedOn={focussedOn} setFocussedOn={setFocussedOn} index={index}/>
            </div>
            )
        })}
    </div>
  );
};

export default MyVideoComponent;