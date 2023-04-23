'use client';

import Head from 'next/head'
import Link from 'next/link';
import { useRouter } from 'next/navigation'
import { useState, useEffect, useContext } from 'react'
import { Blockchain } from './blockchain';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter()
  const [roomName, setRoomName] = useState('')
  const { signer, loadedWeb3 } = useContext(Blockchain);

  const joinRoom = () => {
    router.push(`/room/${roomName || Math.random().toString(36).slice(2)}`)
  }

  const createRoom = () => {
    router.push(`/createRoom/`)
  }

  useEffect(() => {
      if (loadedWeb3) {
          signer?.getAddress().then(addr => console.log(addr));
      }
  }, [loadedWeb3]);

  return (
    <div>
      <Head>
        <title>Native WebRTC API with NextJS</title>
        <meta className={styles.description} content="Use Native WebRTC API for video conferencing" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
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
          <Link href="/profile">
              <button className={`${styles.btn2}`}>Profile</button>
          </Link>
        </div>
      </main>
    </div>
  )
}
