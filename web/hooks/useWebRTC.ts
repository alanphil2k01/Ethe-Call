const ICE_SERVERS = [
    {
        urls: 'stun:openrelay.metered.ca:80',
    }
]

export type Options = {
    certificates?: RTCCertificate[];
    stream?: MediaStream;
    initiator?: boolean;
    addr: string,
}

export class Peer {
    pc: RTCPeerConnection;
    dc: RTCDataChannel;
    addr: string;
    certificates: RTCCertificate[];
    userStream: MediaStream;
    initiator?: boolean;
    dcReady: boolean = false;

    constructor(opts: Options) {
        this.addr = opts.addr;
        this.certificates = opts.certificates;
        this.userStream = opts.stream;
        this.initiator = opts.initiator || false;

        this.pc = new RTCPeerConnection({
            iceServers: ICE_SERVERS,
            certificates: this.certificates,
        })

        this.userStream.getTracks().forEach((track) => {
            this.pc.addTrack(track, this.userStream);
        });

        if (this.initiator) {
            this.dc = this.pc.createDataChannel(`chat ${this.addr}`);
            this.dc.onmessage = this.dcMessageHandler;
            this.dc.onopen = () => {
                if (this.dc.readyState === "open") {
                    this.dcReady = true;
                }
            }
        } else {
            this.pc.ondatachannel = (event) => {
                this.dc = event.channel;
                this.dc.onmessage = this.dcMessageHandler;
                this.dc.onopen = () => {
                    if (this.dc.readyState === "open") {
                        this.dcReady = true;
                    }
                }
            }
        }


    }

    dcMessageHandler(event: MessageEvent) {
        console.log(event.data);
    }

    async createSDP(): Promise<RTCSessionDescription> {
        if (!this.initiator) {
            return;
        }
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        return this.pc.localDescription;

    }

    async setRemoteSDP(sdp: RTCSessionDescription): Promise<RTCSessionDescription | null> {
        await this.pc.setRemoteDescription(sdp);

        if (this.initiator) {
            return null;
        }

        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        return this.pc.localDescription;
    }
}
