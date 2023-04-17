import { useContext } from 'react'
import { Blockchain } from '../app/blockchain';

export default function WalletButton(){
    const {connectMetaMask} = useContext(Blockchain);
    return (
        <button onClick={connectMetaMask}>Connect to MetaMask</button>
    );
}