"use client";

import { Dispatch, ReactNode, SetStateAction, createContext, useState } from "react";

type FingerprintVals = {
    certificates: RTCCertificate[];
    generateNewCertificate: () => Promise<RTCCertificate>;
    getUserFingerprint: () => string;
    generatedCertificate: Boolean;
    setGeneratedCertificate: Dispatch<SetStateAction<Boolean>>;
}

export function extractFingerprint(sdp: RTCSessionDescription): string {
    return sdp.sdp.match(/a=fingerprint:sha-256\s(.+)/)[1];
}

export const Fingerprint = createContext<FingerprintVals>(null);

export function FingerprintProvider({ children }: { children: ReactNode }) {
    const [certificates, setCertificates] = useState<RTCCertificate[]>([])
    const [generatedCertificate, setGeneratedCertificate] = useState(false);

    const config = {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
    };

    async function generateNewCertificate(): Promise<RTCCertificate> {
        const cert  = await RTCPeerConnection.generateCertificate(config)
        setCertificates([cert]);
        return cert;
    }

    function getUserFingerprint(): string {
        return certificates[0].getFingerprints[0];
    }

    return (
        <Fingerprint.Provider value={{
            certificates,
            generateNewCertificate,
            getUserFingerprint,
            generatedCertificate,
            setGeneratedCertificate,
        }}>
            { children }
        </Fingerprint.Provider>
    )
}
