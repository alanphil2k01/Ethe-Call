import { ReactNode, createContext, useState } from "react";

type FingerprintVals = {
    generateNewCertificate: () => void;
    setCertificate: (cert: RTCCertificate) => void;
    getCertificate: () => string;
}

export const Fingerprint = createContext<FingerprintVals>(null);

export default function FingerprintProvider({ children }: { children: ReactNode }) {
    const [certificates, setCertificates] = useState<RTCCertificate[]>([])

    const config = {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
    };

    function generateNewCertificate()  {
        RTCPeerConnection.generateCertificate(config)
            .then((cert) => {
                setCertificates([cert]);
            });
    }

    function setCertificate(cert: RTCCertificate) {
        setCertificates([cert]);
    }

    function getCertificate(): string {
        return JSON.stringify(certificates);
    }

    return (
        <Fingerprint.Provider value={{
            generateNewCertificate,
            setCertificate,
            getCertificate,
        }}>
            { children }
        </Fingerprint.Provider>
    )
}
