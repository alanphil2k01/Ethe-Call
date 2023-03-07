export interface ServerToClientEvents {
    "room full": () => void;
    "all users": (usersList: { socketID: string, addr: string }[]) => void;
    "user joined": (joinedPayload: {offer: RTCSessionDescription, fromUserID: string}) => void;
    "receiving returned answer": (answerReturnPayload: { returnID: string, answer: RTCSessionDescription }) => void;
    "ice candidate": (candidatePayload: { candidate: RTCIceCandidate, fromID: string }) => void;
}

export interface ClientToServerEvents {
    "join room": (joinPayload: { roomID: string, addr: string }) => void;
    "send offer": (offerPayload: { toUserID: string, offer: RTCSessionDescription, fromUserID: string }) => void;
    "return answer": (answerPayload: { callerID: string, answer: RTCSessionDescription }) => void;
    "ice candidate": (candidatePayload: { candidate: RTCIceCandidate, roomID: string, fromID: string }) => void;
}

export interface InterServerEvents {
}

export interface SocketData {
    addr: string
}
