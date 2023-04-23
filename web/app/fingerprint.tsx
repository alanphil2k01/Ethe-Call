"use client";

import { ReactNode, createContext, useState } from "react";

type FingerprintVals = {
    certificates: RTCCertificate[];
    generateNewCertificate: () => Promise<RTCCertificate>;
    setCertificate: (cert: RTCCertificate) => void;
    getCertificate: () => string;
    getUserFingerprint: () => string;
}

export function extractFingerprint(sdp: RTCSessionDescription): string {
    return sdp.sdp.match(/a=fingerprint:sha-256\s(.+)/)[1];
}

export const Fingerprint = createContext<FingerprintVals>(null);

export function FingerprintProvider({ children }: { children: ReactNode }) {
    const [certificates, setCertificates] = useState<RTCCertificate[]>([])

    const config = {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
    };

    async function generateNewCertificate()  {
        const cert  = await RTCPeerConnection.generateCertificate(config)
        setCertificates([cert]);
        return cert;
    }

    function setCertificate(cert: RTCCertificate) {
        setCertificates([cert]);
    }

    function getCertificate(): string {
        return JSON.stringify(certificates);
    }

    function getUserFingerprint(): string {
        return certificates[0].getFingerprints[0];
    }

    return (
        <Fingerprint.Provider value={{
            certificates,
            generateNewCertificate,
            setCertificate,
            getCertificate,
            getUserFingerprint,
        }}>
            { children }
        </Fingerprint.Provider>
    )
}
