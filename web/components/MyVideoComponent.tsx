"use client";

import { Dispatch, MouseEventHandler, MutableRefObject, SetStateAction, useEffect, useRef } from "react";
import { Peer } from "@/app/peer";
import styles from "./MyVideoComponent.module.css";

export function PeerVideo ({ stream, style, onClick, muted }: {
    stream: MediaStream,
    onClick?: MouseEventHandler<HTMLVideoElement>,
   style:string,
   muted?: boolean
   }) {
    const peerVidRef = useRef<HTMLVideoElement>();

    useEffect(() => {
        peerVidRef.current.srcObject = stream;
        peerVidRef.current.muted = muted;
    }, [stream]);

        // <div>
        //     <video autoPlay className="bg-red h-160 w-160" ref={peerVidRef} />
        // </div>
      return style === 'regular' ? (<div className={`${styles.video__container}`}>
          <div className={`${styles.video__player}`}>
              <video autoPlay onClick={onClick} ref={peerVidRef} />
          </div>
        </div>):
        (<video style={{height: "100%", width: "100%"}} autoPlay onClick={onClick} ref={peerVidRef} />)
}

const MyVideoComponent = ({ userStream, peers, focussedOn, setFocussedOn }: { userStream: MutableRefObject<MediaStream>, peers: Peer[], focussedOn: number, setFocussedOn: Dispatch<SetStateAction<number>>}) => {
  return (
    <div id={`${styles.streams__container}`}>
      { focussedOn !== -1 && (
        <PeerVideo stream={userStream.current} muted onClick={() => setFocussedOn(-1)} style="regular" />
      )}
        {peers && peers.map((peer, index) => {
          return index !== focussedOn && (
            <div key={index}>
              <PeerVideo stream={peer.remoteStream} onClick={() => setFocussedOn(index)} style={'regular'}/>
            </div>
            )
        })}
    </div>
  );
};

export default MyVideoComponent;

