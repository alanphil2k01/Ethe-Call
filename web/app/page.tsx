'use client';

import Head from 'next/head'
import { useRouter } from 'next/navigation'
import { useState, useContext, useRef } from 'react'
import { Blockchain } from './blockchain';
import styles from './page.module.css';
import { Fingerprint } from "./fingerprint";

export default function Home() {
    const router = useRouter()
    const [roomName, setRoomName] = useState('')
    const { signer, isAdmitted, roomExists, loadedWeb3 } = useContext(Blockchain);
    const { setFingerprint, setNickname } = useContext(Blockchain);
    const { certificates, generateNewCertificate } = useContext(Fingerprint);
    const nicknameRef = useRef<HTMLInputElement>();

    async function joinRoom() {
    if (!loadedWeb3) {
        alert("Please connect your Meteamask Wallet");
        return;
    }
    if (roomName === "") {
        alert("Room ID is required");
        return;
    }
    if (!(await roomExists(roomName))) {
        alert("Room ID does not exist");
        return;
    }
    if (!(await isAdmitted(roomName, signer.address))) {
        alert("You are not admitted to this room");
        return;
    }
    router.push(`/room2/${roomName || Math.random().toString(36).slice(2)}`)
    }

    const createRoom = () => {
    if (!loadedWeb3) {
        alert("Please connect your Meteamask Wallet");
        return;
    }
    router.push(`/createRoom/`)
    }

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
    <div>
      <Head>
        <title>Native WebRTC API with NextJS</title>
        <meta className={styles.description} content="Use Native WebRTC API for video conferencing" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      { !loadedWeb3 && (<main className={styles.main}><p>Please connect to MetaMask</p></main>) }

      { loadedWeb3 && (
      <main className={styles.main}>
            <button onClick={generate}>Generate Certificate</button>
            <input ref={nicknameRef} className="border-2 border-black" type="text" />
            <button onClick={set}>Set Nickname</button>
            { certificates.length !== 0 && (
                <>
                    <div className={`${styles.heading}`}>
                      Start your video call
                    </div>
                    <div className={`${styles.inputBox}`}>
                      <input onChange={(e) => setRoomName(e.target.value)} value={roomName} required />
                      <span>Room ID</span>
                    </div>
                    <div className={`${styles.container}`}>
                      <button onClick={joinRoom} className={`${styles.btn2}`}>Join Room</button>
                      <button onClick={createRoom} className={`${styles.btn2}`}>Create Room</button>
                    </div>
                </>
            ) }
      </main> )
      }
    </div>
  )
}
