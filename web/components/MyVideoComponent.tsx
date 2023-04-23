import React from "react";


const MyVideoComponent = ({ stream, peers }) => {
  return (
    <div>
      <video autoPlay muted className="h-80 w-80 bg-black" ref={stream} />
      {peers.map((peer, index) => {
        return (
          <div key={index}>
            <MyVideoComponent stream={peer.remoteStream} peers={peer.peers} />
          </div>
        );
      })}
    </div>
  );
};

export default MyVideoComponent;
