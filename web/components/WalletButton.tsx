import { useContext } from 'react'
import { Blockchain } from '../app/blockchain';
import styles from './WalletButton.module.css';

export default function WalletButton(){
    const {connectMetaMask} = useContext(Blockchain);
    return (
        <button onClick={connectMetaMask} className={styles.button}>Connect to MetaMask</button>
    );
}