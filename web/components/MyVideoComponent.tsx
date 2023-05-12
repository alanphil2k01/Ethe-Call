"use client";

import { Dispatch, MouseEventHandler, MutableRefObject, SetStateAction, useEffect, useRef } from "react";
import { Peer } from "@/app/peer";
import styles from "./MyVideoComponent.module.css";

export function PeerVideo ({ stream, style, onClick }: {
    stream: MediaStream,
    onClick?: MouseEventHandler<HTMLVideoElement>,
   style:string }) {
    const peerVidRef = useRef<HTMLVideoElement>();

    useEffect(() => {
        peerVidRef.current.srcObject = stream;
    }, [stream]);

        // <div>
        //     <video autoPlay className="bg-red h-160 w-160" ref={peerVidRef} />
        // </div>
      return style === 'regular' ? (<div className={`${styles.video__container}`}>
          <div className={`${styles.video__player}`}>
              <video autoPlay onClick={onClick} ref={peerVidRef} />
          </div>
        </div>):
        (<video autoPlay onClick={onClick} ref={peerVidRef} />)
}

const MyVideoComponent = ({ userStream, peers, focussedOn, setFocussedOn }: { userStream: MutableRefObject<MediaStream>, peers: Peer[], focussedOn: number, setFocussedOn: Dispatch<SetStateAction<number>>}) => {
  return (
    <div id={`${styles.streams__container}`}>
      { focussedOn !== -1 && (
        <PeerVideo stream={userStream.current} onClick={() => setFocussedOn(-1)} style="regular" />
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

