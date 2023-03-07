import type { Server as HTTPServer } from 'http'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { Socket as NetSocket } from 'net'
import { Server as IOServer } from 'socket.io'
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '@/types/socket';

interface SocketServer extends HTTPServer {
  io?: IOServer | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

const users: { [key: string]: { socketID: string, addr: string }[] }= {};

const socketToRoom: { [key: string]: string } = {};

const SocketHandler = (_: NextApiRequest, res: NextApiResponseWithSocket) => {
    if (res.socket.server.io) {
        console.log('Socket is already attached');
        return res.end();
    }

    const io = new IOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
        socket.on("join room", ({ roomID, addr }) => {
            socket.data.addr = addr;

            if (users[roomID]) {
                const length = users[roomID].length;
                if (length === 5) {
                    socket.emit("room full");
                    return;
                }
                let f = 0;
                for (let i = 0; i < users[roomID].length; i++) {
                    const user = users[roomID][i];
                    if (user.addr === addr) {
                        user.socketID = socket.id;
                        f = 1;
                        break;
                    }
                }
                if (f === 0) {
                    users[roomID].push({ socketID: socket.id, addr });
                } } else {
                    users[roomID] = [{ socketID: socket.id, addr }];
                }
            socketToRoom[socket.id] = roomID;
            console.log("all users in room: ", users[roomID]);

            const usersInThisRoom = users[roomID].filter((user) => addr !== user.addr);

            console.log("users in room: ", usersInThisRoom);

            socket.emit("all users", usersInThisRoom);
        });

        socket.on("send offer", ({ toUserID, offer, fromUserID }) => {
            io.to(toUserID).emit("user joined", { offer, fromUserID });
        });

        socket.on("return answer", ({ answer, callerID }) => {
            io.to(callerID).emit('receiving returned answer', { answer, returnID: socket.id });
        });

        socket.on('disconnect', () => {
            const roomID = socketToRoom[socket.id];
            let room = users[roomID];
            if (room) {
                room = room.filter(user => user.socketID !== socket.id);
                users[roomID] = room;
            }
        });

        socket.on("ice candidate", ({ candidate, roomID, fromID }) => {
            users[roomID].forEach(user => {
                if (fromID !== user.socketID) {
                    socket.to(user.socketID).emit("ice candidate", { candidate, fromID });
                }
            });
        });

    });

    return res.end();
};

export default SocketHandler;
