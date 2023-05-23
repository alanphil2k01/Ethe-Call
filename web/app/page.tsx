"use client";

import Head from 'next/head'
import { useRouter } from 'next/navigation'
import { useState, useContext, useRef } from 'react'
import { Blockchain } from './blockchain';
import styles from './page.module.css';
import { Fingerprint } from "./fingerprint";
import { toast } from 'react-toastify';


export default function Home() {
    const router = useRouter()
    const [roomName, setRoomName] = useState('')
    const { signer, isAdmitted, roomExists, loadedWeb3 } = useContext(Blockchain);
    const { setFingerprint, setNickname } = useContext(Blockchain);
    const {displayName} = useContext(Blockchain);
    const { generatedCertificate, setGeneratedCertificate, generateNewCertificate} = useContext(Fingerprint);
    const nicknameRef = useRef<HTMLInputElement>();
    const [showSettings, setShowSettings] = useState(false);

    async function joinRoom() {
    if (!loadedWeb3) {
        toast.warn("Please connect your Metamask Wallet");
        return;
    }
    if (roomName === "") {
        toast.warn("Room ID is required");
        return;
    }
    if (!(await roomExists(roomName))) {
        toast.warn("Room ID does not exist");
        return;
    }
    if (!(await isAdmitted(roomName, signer.address))) {
        toast.warn("You are not admitted to this room");
        return;
    }
    router.push(`/room2/${roomName || Math.random().toString(36).slice(2)}`)
    }

    const createRoom = () => {
      if (!loadedWeb3) {
          toast.warn("Please connect your Metamask Wallet");
          return;
      }
      router.push(`/createRoom/`)
    }

    async function generate() {
        const cert = await generateNewCertificate();
        const fingerprint = (cert.getFingerprints())[0].value;
        await toast.promise(
            () => setFingerprint(fingerprint),
            {
                  pending: 'Generating Certificates',
                }
        )
        setGeneratedCertificate(true);
        setShowSettings(false);
    }

    async function set() {
        const nickname = nicknameRef.current.value;
        await toast.promise(
            () => setNickname(nickname),
            {
                  pending: 'Setting nickname',
                }
        )
        nicknameRef.current.value = "";
    }


  return (
    <div>
      <Head>
        <title>Native WebRTC API with NextJS</title>
        <meta className={styles.description} content="Use Native WebRTC API for video conferencing" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>

      { !loadedWeb3 && (<div>Please connect to MetaMask</div>) }

      { (loadedWeb3 && (showSettings || !generatedCertificate)) && (
            <div id={`${styles.room__lobby__container}`}>
              <div id={`${styles.form__container}`}>
                <div id={`${styles.form__container__header}`}>
                    <p className={`${styles.text}`}>Setup your profile 👨‍🏭🔧</p>
                </div>

                <form id={`${styles.lobby__form}`} onSubmit={(event) => {event.preventDefault()}}>
                  <div className={`${styles.form__field__wrapper}`}>
                    <button onClick={generate}>{!generatedCertificate ? "Generate Certificate" : "Generate New Certificate"}
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/></svg>
                    </button>
                  </div>

                  <div className={`${styles.form__field__wrapper}`}>
                  <label><p>Your Name</p></label>
                  <div style={{display:"flex", flexDirection: "row", gap: "1em", alignItems: "baseline", boxSizing: "border-box", padding: "0px"}}>
                    <input type="text" ref={nicknameRef} name="name" placeholder={displayName} />
                    <button onClick={set} style={{boxSizing: "border-box"}}>Set Nickname
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/></svg>
                    </button>
                  </div>
                </div>

                <div className={`${styles.form__field__wrapper}`}>
                  <button type="submit" onClick={createRoom}>Create room for later
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/></svg>
                  </button>
                </div>

                  {/* <div className={`${styles.form__field__wrapper}`}>

                  </div> */}

                </form>
              </div>
            </div>
            )}
                 {/* { certificates.length !== 0 && (
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
                ) } */}
         { loadedWeb3 && generatedCertificate && !showSettings && (
          <div id={`${styles.room__lobby__container}`}>
            <div id={`${styles.form__container}`}>
              <div id={`${styles.form__container__header}`}>
                  <p className={`${styles.text}`}>👋 Create or Join Room</p>
              </div>


              <form id={`${styles.lobby__form}`} onSubmit={(event) => {event.preventDefault()}}>

                <div className={`${styles.form__field__wrapper}`}>
                  <label>Room Name</label>
                  <input type="text" name="room" onChange={(e) => setRoomName(e.target.value)} value={roomName} required placeholder="Enter room name..." />
                </div>

                <div className={`${styles.form__field__wrapper}`}>
                  <button type="submit" onClick={joinRoom}>Join room
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/></svg>
                  </button>
                  <label style={{textAlign: 'center', marginTop:30}}><p>Or</p></label>
                  <button type="submit" onClick={createRoom}>Create room
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/></svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
          )}
          { loadedWeb3 && generatedCertificate && (
            <button className={`${styles.settings_btn}`} onClick={() => setShowSettings(prev => !prev)}>
                { showSettings ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM281 385c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l71-71L136 280c-13.3 0-24-10.7-24-24s10.7-24 24-24l182.1 0-71-71c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0L393 239c9.4 9.4 9.4 24.6 0 33.9L281 385z"/></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M512 256A256 256 0 1 0 0 256a256 256 0 1 0 512 0zM231 127c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-71 71L376 232c13.3 0 24 10.7 24 24s-10.7 24-24 24l-182.1 0 71 71c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0L119 273c-9.4-9.4-9.4-24.6 0-33.9L231 127z"/></svg>
                ) }
            </button>
          )}
      </main>
    </div>
  )
}
