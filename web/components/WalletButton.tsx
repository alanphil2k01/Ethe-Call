"use client";

import { useContext, useEffect, useState } from 'react'
import { Blockchain } from '../app/blockchain';
import styles from './WalletButton.module.css';

export default function WalletButton() {
    const { loadedWeb3, displayName, connectMetaMask } = useContext(Blockchain);
    const [text, setText] = useState("Connect to MetaMask");

    useEffect(() => {
        if (loadedWeb3) {
            setText("Hi, " + displayName);
        } else {
            setText("Connect to MetaMask");
        }
    }, [loadedWeb3, displayName]);

    function walletBtnAction() {
        if (!loadedWeb3) {
            connectMetaMask();
        }
    }
    // 
    return (
        <button onClick={walletBtnAction} className={!loadedWeb3 ? `${styles.newStyle}` : `${styles.newStyle_active}`}>{text}</button>
    );
}
