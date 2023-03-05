// hooks/useSocket.js
import { useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from '@/types/socket';
import { MutableRefObject } from "react";

const useSocket = (): MutableRefObject<Socket<ServerToClientEvents, ClientToServerEvents> >=> {
  const socketCreated = useRef(false)
    const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents>>();

  useEffect(() =>{
    if (!socketCreated.current) {
      try {
        fetch("/api/socket2")
        .then(() => {
            socketRef.current = io()
            socketCreated.current = true
            console.log("Inside " + socketRef.current);
        });
      } catch (error) {
        console.log(error)
      }
    }
  }, []);

  return socketRef;
};

export default useSocket
