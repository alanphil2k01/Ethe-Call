"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const port = parseInt(process.env.PORT) || 8000;
function roomAddrPair(roomID, addr) {
    return `${roomID}:${addr}`;
}
const users = {};
const socketToRoom = {};
const roomAdddrPairToSocket = {};
const httpServer = (0, http_1.createServer)();
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    }
});
io.on('connection', (socket) => {
    console.log("User connected: " + socket.id);
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
        }
        else {
            users[roomID] = [{ socketID: socket.id, userData: payload }];
        }
        socketToRoom[socket.id] = roomID;
        roomAdddrPairToSocket[roomAddrPair(roomID, payload.address)] = socket.id;
        const usersInThisRoom = users[roomID].filter((user) => {
            return payload.address !== user.userData.address;
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
        var _a;
        const roomID = socketToRoom[socket.id];
        users[roomID] = ((_a = users[roomID]) === null || _a === void 0 ? void 0 : _a.filter(user => user.socketID !== socket.id)) || [];
        users[roomID].forEach((user) => {
            io.to(user.socketID).emit("user disconnected", socket.data.userData.address);
        });
        console.log("User disconnected: " + socket.id);
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
httpServer.listen(port, () => {
    console.log("Starting server on port: " + port);
});
