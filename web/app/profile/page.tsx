"use client";

import { Fingerprint } from "@/app/fingerprint";
import { useContext, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Blockchain } from "../blockchain";

export default function Profile() {
    const nicknameRef = useRef<HTMLInputElement>();

    const router = useRouter();

    const { loadedWeb3, signer, setFingerprint, setNickname } = useContext(Blockchain);
    const { generateNewCertificate } = useContext(Fingerprint);

    useEffect(() => {
        console.log(signer);
        console.log(loadedWeb3);
        if (!loadedWeb3) {
            alert("Not connected to metamask");
            router.push("/");
        }
    }, []);

    async function generate() {
        const cert = await generateNewCertificate();
        const fingerprint = (cert.getFingerprints())[0].value;
        await setFingerprint(fingerprint);
    }

    async function set() {
        const nickname = nicknameRef.current.value;
        await setNickname(nickname);
        nicknameRef.current.value = "";
    }

    return (
        <>
            <button onClick={generate}>Generate Certificate</button>
            <button>Set Certificate</button>
            <button>Get Certificate</button>
            <input ref={nicknameRef} className="border-2 border-black" type="text" />
            <button onClick={set}>Set Nickname</button>
        </>
    )
}
