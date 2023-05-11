import type { Server as HTTPServer } from 'http'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { Socket as NetSocket } from 'net'
import { Server as IOServer } from 'socket.io'
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, UserData } from '@/types/socket';

interface SocketServer extends HTTPServer {
  io?: IOServer | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

function roomAddrPair(roomID: string, addr: string): string {
    return `${roomID}:${addr}`;
}
const users: { [roomID: string]: { socketID: string, userData: UserData }[] }= {};
const socketToRoom: { [socketID: string]: string } = {};
const roomAdddrPairToSocket: { [key: string]: string } = {};

const SocketHandler = (_: NextApiRequest, res: NextApiResponseWithSocket) => {
    if (res.socket.server.io) {
        return res.end();
    }

    const io = new IOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
        socket.on("join room", (roomID, payload) => {
            socket.data.userData = payload;
            if (users[roomID]) {
                const count = users[roomID].length;
                if (count === 10) {
                    socket.emit("room full");
                    return;
                }
                let f = 0;
                for (let i = 0; i < users[roomID].length; i++) {
                    const user = users[roomID][i];
                    if (user.userData.address === payload.address) {
                        user.socketID = socket.id;
                        f = 1;
                        break;
                    }
                }
                if (f === 0) {
                    users[roomID].push({ socketID: socket.id, userData: payload });
                }
            } else {
                users[roomID] = [{ socketID: socket.id, userData: payload }];
            }
            socketToRoom[socket.id] = roomID;
            roomAdddrPairToSocket[roomAddrPair(roomID, payload.address)] = socket.id;
            const usersInThisRoom = users[roomID].filter((user) => {
                return payload.address !== user.userData.address
            }).map((userInfo) => {
                return userInfo.userData;
            });
            socket.emit("all users", usersInThisRoom);
        });

        socket.on("send offer", (offer, toAddr) => {
            const roomID = socketToRoom[socket.id];
            const toUserID = roomAdddrPairToSocket[roomAddrPair(roomID, toAddr)];
            io.to(toUserID).emit("user joined", offer, socket.data.userData);
        });

        socket.on("return answer", (answer, toAddr) => {
            const roomID = socketToRoom[socket.id];
            const toUserID = roomAdddrPairToSocket[roomAddrPair(roomID, toAddr)];
            const fromAddr = socket.data.userData.address;
            io.to(toUserID).emit('receiving returned answer', answer, fromAddr);
        });

        socket.on('disconnect', () => {
            const roomID = socketToRoom[socket.id];
            users[roomID] = users[roomID]?.filter(user => user.socketID !== socket.id);
            users[roomID].forEach((user) => {
                io.to(user.socketID).emit("user disconnected", socket.data.userData.address);
            });
        });

        socket.on("ice candidate", (candidate) => {
            const roomID = socketToRoom[socket.id];
            const fromAddr = socket.data.userData.address;
            const fromID = roomAdddrPairToSocket[roomAddrPair(roomID, fromAddr)];
            users[roomID].forEach(user => {
                if (fromID !== user.socketID) {
                    socket.to(user.socketID).emit("ice candidate", candidate, fromAddr);
                }
            });
        });

    });

    return res.end();
};

export default SocketHandler;
