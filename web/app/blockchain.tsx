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
    newCall: (call_id: string) => Promise<void>;
    newCallWithUsers: (call_id: string, users: string[], admins: string[]) => Promise<void>;
    getNickname: (user: string) => Promise<string>;
    getFingerprint: (user: string) => Promise<string>;
    nicknameToAddress: (nickname: string) => Promise<string>;
    getHost: (call_id: string) => Promise<string>;
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
        await (window as any)?.ethereum?.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
        });
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

    async function newCall(call_id: string) {
        try {
            const tx = await contract.newCall(call_id);
            await tx.wait();
        } catch (err) {
            alert(err.reason);
        }
    }

    async function newCallWithUsers(call_id: string, users: string[], admins: string[]) {
        try {
            const tx = await contract.newCall(call_id, users, admins);
            await tx.wait();
        } catch (err) {
            alert(err?.reason);
        }
    }

    async function getNickname(user: string): Promise<string> {
        const nickname = await contract.getNickname(user);
        return nickname;
    }

    async function getFingerprint(user: string): Promise<string> {
        const fingerprint = await contract.getFingerprint(user);
        return fingerprint;
    }

    async function nicknameToAddress(nickname: string): Promise<string> {
        const address = await contract.nicknameToAddress(nickname);
        return address;
    }

    async function getHost(call_id: string): Promise<string> {
        try {
            const host: string = await contract.getHost(call_id);
            return host;
        } catch (err) {
            console.log(err?.reason);
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
            newCall,
            newCallWithUsers,
            getNickname,
            getFingerprint,
            nicknameToAddress,
            getHost,
        }}>
            {children}
        </Blockchain.Provider>
    )
}
