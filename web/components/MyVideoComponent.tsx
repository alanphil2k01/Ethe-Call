"use client";

import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef } from "react";
import { Peer } from "@/app/peer";
import styles from "./MyVideoComponent.module.css";

export function PeerVideo ({ stream, focussedOn, setFocussedOn, index, style }: { stream: MediaStream, focussedOn: number, setFocussedOn: Dispatch<SetStateAction<number>>, index:number, style:string }) {
    const peerVidRef = useRef<HTMLVideoElement>();

    useEffect(() => {
        peerVidRef.current.srcObject = stream;
    }, [stream]);

        // <div>
        //     <video autoPlay className="bg-red h-160 w-160" ref={peerVidRef} />
        // </div>
      return style === 'regular' ? (<div className={`${styles.video__container}`}>
          <div className={`${styles.video__player}`}>
              <video autoPlay onClick={()=>{setFocussedOn(index)}} ref={peerVidRef} />
          </div>
        </div>):
        (<video autoPlay onClick={()=>{setFocussedOn(index)}} ref={peerVidRef} />)
}

const MyVideoComponent = ({ stream, peers, focussedOn, setFocussedOn }: { stream: MutableRefObject<HTMLVideoElement>, peers: Peer[], focussedOn: number, setFocussedOn: Dispatch<SetStateAction<number>>}) => {
  return (
    <div id={`${styles.streams__container}`}>
      { focussedOn !== -1 && <div className={`${styles.video__container}`}>
        <div className={`${styles.video__player}`}>
          <video autoPlay onClick={()=>{setFocussedOn(-1)}} muted ref={stream} />
        </div>
      </div>}
        {peers && peers.map((peer, index) => {
          return index !== focussedOn && (
            <div key={index}>
              <PeerVideo stream={peer.remoteStream} focussedOn={focussedOn} setFocussedOn={setFocussedOn} index={index} style={'regular'}/>
            </div>
            )
        })}
    </div>
  );
};

export default MyVideoComponent;