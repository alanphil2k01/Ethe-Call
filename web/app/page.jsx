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
    <div >
      <Head>
        <title>Native WebRTC API with NextJS</title>
        <meta className={styles.description} content="Use Native WebRTC API for video conferencing" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
       <h1 className='text-2xl'>Lets join a room!</h1>
       <input onChange={(e) => setRoomName(e.target.value)} value={roomName}  />
       <button className="bg-sky-200 hover:bg-blue-700 transition ease-in-out delay-150 -translate-y-1 hover:scale-110 text-white font-bold py-2 px-4 rounded" onClick={joinRoom} type="button" >Join Room</button>
       <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={createRoom} type="button" >Create Room</button>
       <Link href="" />
      </main>
    </div>
  )
}
