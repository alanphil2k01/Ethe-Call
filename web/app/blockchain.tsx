"use client";

import contractABI from "@common/EtheCall.json";
import contract_addr from "@common/contract_addr";
import { BrowserProvider, Contract, JsonRpcSigner } from "ethers";
import { ReactNode, createContext, useEffect, useState } from "react";
import { MetaMaskInpageProvider } from "@metamask/providers";

declare global {
  interface Window{
    ethereum?:MetaMaskInpageProvider
  }
}

interface BlockchainVals {
    signer: JsonRpcSigner;
    contract: Contract;
    provider: BrowserProvider;
    loading: boolean;
    loadedWeb3: boolean;
    connectMetaMask: () => void;
    setFingerprint: (fingerprint: string) => Promise<void>;
    setNickname: (nickname: string) => Promise<void>;
}

export const Blockchain = createContext<BlockchainVals>(null);

export function BlockchainProvider({ children }: { children: ReactNode }) {
    const [provider, setProvider] = useState<BrowserProvider>();
    const [signer, setSigner] = useState<JsonRpcSigner>();
    const [contract, setContract] = useState<Contract>();
    const [loading, isLoading] = useState(false);
    const [loadedWeb3, setLoadedWeb3] = useState(false);

    async function loadWeb3() {
        const provider = new BrowserProvider(window.ethereum)
        const signer = await provider.getSigner();
        const contract = new Contract(contract_addr, contractABI.abi, signer);
        setProvider(provider);
        setSigner(signer);
        setContract(contract);
    }

    function connectMetaMask() {
        isLoading(true);
        if (window.ethereum == null) {
            alert("Please install metamask");
        } else {
            loadWeb3()
            .then(() => setLoadedWeb3(true));
        }
        isLoading(false);
    }

    useEffect(() => {
        connectMetaMask();
    }, []);

    async function setFingerprint(fingerprint: string) {
        console.log(fingerprint);
        console.log(fingerprint.length);

        try {
            await contract.setFingerprint(fingerprint);
        } catch (err) {
            alert(err?.reason);
        }
    }

    async function setNickname(nickname: string) {
        try {
            await contract.setNickname(nickname);
        } catch (err) {
            alert(err.reason);
        }
    }

    return (
        <Blockchain.Provider value={{
            signer,
            provider,
            contract: contract,
            loading,
            loadedWeb3,
            connectMetaMask,
            setFingerprint,
            setNickname,
        }}>
            {children}
        </Blockchain.Provider>
    )
}
