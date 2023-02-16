'use client';

import Head from 'next/head'
import Link from 'next/link';
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from './page.module.css';

export default function Home() {
  const router = useRouter()
  const [roomName, setRoomName] = useState('')

  const joinRoom = () => {
    router.push(`/room/${roomName || Math.random().toString(36).slice(2)}`)
  }

  return (
    <div >
      <Head>
        <title>Native WebRTC API with NextJS</title>
        <meta className={styles.description} content="Use Native WebRTC API for video conferencing" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
       <h1 className='text-2xl'>Lets join a room!</h1>
       <input onChange={(e) => setRoomName(e.target.value)} value={roomName}  />
       <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={joinRoom} type="button" >Join Room</button>
       <Link href="" />
      </main>
    </div>
  )
}
