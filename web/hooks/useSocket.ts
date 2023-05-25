// hooks/useSocket.js
import { useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from 'common-types/socket';

const useSocket = () => {
  const socketCreated = useRef(false)
    const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents>>();

  useEffect(() =>{
    if (!socketCreated.current) {
      const socketInitializer = async () => {
        await fetch ('/api/socket2')
        socketRef.current = io();
      }
      try {
        socketInitializer()
            .then(() => {
                socketCreated.current = true
            });
      } catch (error) {
        console.log(error)
      }
    }
  }, []);

  return { socketRef };
};

export default useSocket
