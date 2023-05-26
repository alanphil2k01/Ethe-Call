import { createServer as createServerHTTP } from "http";
import { createServer as createServerHTTPS } from "https";
import { Server, Socket } from 'socket.io'
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, UserData } from "common-types/socket";
import * as path from "path";
import * as fs from "fs";

const httpPort: number = parseInt(process.env.HTTP_PORT) || 8000;
const httpsPort: number = parseInt(process.env.HTTPS_PORT) || 8001;
const useHttps = process.env.HTTPS === 'yes';
const certDir = process.env.CERT_DIR || './certs';

const sslKeyPath = path.join(certDir, 'privkey.pem');
const sslCertPath = path.join(certDir, 'cert.pem');
const sslCaPath = path.join(certDir, 'chain.pem');

function roomAddrPair(roomID: string, addr: string): string {
    return `${roomID}:${addr}`;
}
const users: { [roomID: string]: { socketID: string, userData: UserData }[] }= {};
const socketToRoom: { [socketID: string]: string } = {};
const roomAdddrPairToSocket: { [key: string]: string } = {};

function socketHandler(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) {
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
        users[roomID] = users[roomID]?.filter(user => user.socketID !== socket.id) || [];
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
}

const httpServer = createServerHTTP();
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    }
});

io.on('connection', (socket) => socketHandler(socket, io));


httpServer.listen(httpPort, () => {
    console.log("Starting HTTP server on port: " + httpPort);
})

if (useHttps) {
    const sslOptions = {
        key: fs.readFileSync(path.resolve(sslKeyPath)),
        cert: fs.readFileSync(path.resolve(sslCertPath)),
        ca: fs.readFileSync(path.resolve(sslCaPath))
    };
    const httpsServer = createServerHTTPS(sslOptions);
    const secureIo = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpsServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        }
    });

    secureIo.on('connection', (socket) => socketHandler(socket, secureIo));

    httpsServer.listen(httpsPort, () => {
        console.log("Starting HTTPs server on port: " + httpsPort);
    });

} else {
}
