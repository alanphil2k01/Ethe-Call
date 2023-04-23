export type Options = {
    certificates?: RTCCertificate[];
    stream?: MediaStream;
    initiator?: boolean;
    addr: string,
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

    constructor(opts: Options) {
        this.addr = opts.addr;
        this.certificates = opts.certificates;
        this.userStream = opts.stream;
        this.initiator = opts.initiator || false;

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
    }

    addTracks() {
        if (this.userStream) {
            this.userStream.getTracks().forEach((track) => {
                this.pc.addTrack(track, this.userStream);
            });
        }
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
}
