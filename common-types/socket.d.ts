export interface UserData {
    address: string;
    message: string;
    sign: string;
    displayName: string;
}

export interface ServerToClientEvents {
    "room full": () => void;
    "all users": (usersList: UserData[]) => void;
    "user joined": (offer: RTCSessionDescription, peerData: UserData) => void;
    "receiving returned answer": (answer: RTCSessionDescription, returnAddr: string) => void;
    "ice candidate": (candidate: RTCIceCandidate, fromAddr: string) => void;
    "user disconnected": (addr: string) => void;
}

export interface ClientToServerEvents {
    "join room": ( roomID: string, payload: UserData ) => void;
    "send offer": (offer: RTCSessionDescription, toAddr: string) => void;
    "return answer": (answer: RTCSessionDescription, toAddr: string) => void;
    "ice candidate": (candidate: RTCIceCandidate) => void;
}

export interface InterServerEvents {
}

export interface SocketData {
    userData: UserData
}
