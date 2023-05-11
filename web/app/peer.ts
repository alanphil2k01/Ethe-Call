import { UserData } from "@/types/socket";

export type Options = {
    initiator?: boolean;
    certificates: RTCCertificate[];
    stream: MediaStream;
    peerData: UserData;
    iceHandler: (event: RTCPeerConnectionIceEvent) => void;
    dcMessageHandler: (event: MessageEvent) => void;
}

const ICE_SERVERS = [
    {
        urls: 'stun:openrelay.metered.ca:80',
    }
]

export class Peer {
    pc: RTCPeerConnection;
    dc: RTCDataChannel;
    addr: string;
    certificates: RTCCertificate[];
    userStream: MediaStream;
    initiator?: boolean;
    dcReady: boolean = false;
    remoteStream: MediaStream;
    peerData: UserData;
    senders: RTCRtpSender[] = [];

    constructor(opts: Options) {
        this.certificates = opts.certificates;
        this.userStream = opts.stream;
        this.initiator = opts.initiator || false;
        this.peerData = opts.peerData || null;

        this.pc = new RTCPeerConnection({
            iceServers: ICE_SERVERS,
            certificates: this.certificates,
        })

        if (this.initiator) {
            this.dc = this.pc.createDataChannel(`chat ${this.addr}`);
            this.dc.onmessage = opts.dcMessageHandler;
            this.dc.onopen = () => {
                if (this.dc.readyState === "open") {
                    this.dcReady = true;
                }
            }
        } else {
            this.pc.ondatachannel = (event) => {
                this.dc = event.channel;
                this.dc.onmessage = opts.dcMessageHandler;
                this.dc.onopen = () => {
                    if (this.dc.readyState === "open") {
                        this.dcReady = true;
                    }
                }
            }
        }
        this.pc.onicecandidate = opts.iceHandler;
    }

    addTracks() {
        if (this.userStream) {
            this.userStream.getTracks().forEach((track) => {
                const sender = this.pc.addTrack(track, this.userStream);
                this.senders.push(sender);
            });
        }
    }

    swapStream(stream: MediaStream) {
        this.senders.forEach((sender) => this.pc.removeTrack(sender));
        this.userStream = stream;
        this.addTracks();
    }

    updateStream(stream: MediaStream) {
        this.userStream = stream;
        this.senders.forEach((sender) => {
            const track = this.userStream.getTracks().find((track) => track.kind === sender.track.kind);
            if (track) {
                sender.replaceTrack(track);
            }
        });
    }

    async createSDP(): Promise<RTCSessionDescription> {
        if (!this.initiator) {
            return;
        }
        this.addTracks();
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        return this.pc.localDescription;

    }

    async createSDPWithOffer(offer: RTCSessionDescription): Promise<RTCSessionDescription> {
        if (!this.initiator) {
            return;
        }
        this.addTracks();
        await this.pc.setLocalDescription(offer);
        return this.pc.localDescription;

    }

    async setRemoteSDP(sdp: RTCSessionDescription): Promise<RTCSessionDescription | null> {
        this.pc.setRemoteDescription(sdp);
        if (this.initiator) {
            return;
        }
        this.addTracks();
        let answer: RTCSessionDescription;
        await this.pc.createAnswer()
        .then((answerSDP) => {
            answer = new RTCSessionDescription(answerSDP);
            this.pc.setLocalDescription(answer);
        })
        return answer;
    }

    async setRemoteSDPWithAnswer(sdp: RTCSessionDescription, answer: RTCSessionDescription): Promise<RTCSessionDescription | null> {
        await this.pc.setRemoteDescription(sdp);
        if (this.initiator) {
            return;
        }
        this.addTracks();
        await this.pc.setLocalDescription(answer);
        return answer;
    }
}
