'use client';

import Head from 'next/head'
import Link from 'next/link';
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import styles from './page.module.css';
import { useWalletDetails } from '../hooks/blockchain';

export default function Home() {
  const router = useRouter()
  const [roomName, setRoomName] = useState('')
  const { acc, Ethe_Call, loading } = useWalletDetails();

  const joinRoom = () => {
    router.push(`/room/${roomName || Math.random().toString(36).slice(2)}`)
  }
  
  const createRoom = () => {
    router.push(`/createRoom/`)
  }



  useEffect(() => {
      console.log(acc);
  });

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
          <input onChange={(e) => setRoomName(e.target.value)} value={roomName} required="required"/>
          <span>Room ID</span>
        </div>
        <div className={`${styles.container}`}>
          <button onClick={joinRoom} className={`${styles.btn2}`}>Join Room</button>
          <button onClick={createRoom} className={`${styles.btn2}`}>Create Room</button>
        </div>
        <Link href="" />
      </main>
    </div>
  )
}
