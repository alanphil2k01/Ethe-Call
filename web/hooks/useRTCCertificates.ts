import { useEffect, useRef } from "react";

export default function useRTCCertificate() {
    const certificates = useRef<RTCCertificate[]>([])
    const config = {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
    };

    useEffect(() => {
        RTCPeerConnection.generateCertificate(config)
            .then((cert) => {
                certificates.current = [cert];
            });
    }, []);

    return { certificates };
}
