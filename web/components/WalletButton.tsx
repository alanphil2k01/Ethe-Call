"use client";

import { useContext, useEffect, useState } from 'react'
import { Blockchain } from '../app/blockchain';
import styles from './WalletButton.module.css';
import { useRouter } from 'next/navigation';

export default function WalletButton() {
    const { loadedWeb3, user, connectMetaMask, getNickname } = useContext(Blockchain);
    const [text, setText] = useState("Connect to MetaMask");
    const router = useRouter();

    useEffect(() => {
        if (loadedWeb3) {
            setText("Hi, " + user);
        } else {
            setText("Connect to MetaMask");
        }
    }, [user]);

    function walletBtnAction() {
        if (loadedWeb3) {
            router.push("/profile");
        } else {
            connectMetaMask();
        }
    }
    return (
        <button onClick={walletBtnAction} onMouseOver={() => {
                if (!loadedWeb3) return;
                setText("Go to profile");
            }} onMouseLeave={() => {
                if (!loadedWeb3) return;
                setText("Hi, " + user)
            }} className={ !loadedWeb3 ? styles.button : styles.button_active }>{text}</button>
    );
}
