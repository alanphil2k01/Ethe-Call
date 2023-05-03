"use client";

import contractABI from "@common/EtheCall.json";
import contract_addr from "@common/contract_addr";
import { BrowserProvider, Contract, JsonRpcSigner, ZeroAddress } from "ethers";
import { ReactNode, createContext, useState } from "react";
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
    user: string;
    loading: boolean;
    loadedWeb3: boolean;
    connectMetaMask: () => void;
    setFingerprint: (fingerprint: string) => Promise<void>;
    setNickname: (nickname: string) => Promise<void>;
    newCall: (call_id: string) => Promise<void>;
    newCallWithUsers: (call_id: string, users: string[], admins: string[]) => Promise<Boolean>;
    getNickname: (user: string) => Promise<string>;
    getFingerprint: (user: string) => Promise<string>;
    nicknameToAddress: (nickname: string) => Promise<string>;
    getHost: (call_id: string) => Promise<string>;
    roomExists: (call_id: string) => Promise<Boolean>;
    isAdmitted: (call_id: string, address: string) => Promise<Boolean>;
    isAdmin: (call_id: string, address: string) => Promise<Boolean>;
}

export const Blockchain = createContext<BlockchainVals>(null);

export function BlockchainProvider({ children }: { children: ReactNode }) {
    const [provider, setProvider] = useState<BrowserProvider>();
    const [signer, setSigner] = useState<JsonRpcSigner>();
    const [contract, setContract] = useState<Contract>();
    const [user, setUser] = useState("");
    const [loading, isLoading] = useState(false);
    const [loadedWeb3, setLoadedWeb3] = useState(false);

    async function loadWeb3() {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new Contract(contract_addr, contractABI.abi, signer);
        const user = await contract.getNickname(signer.address);
        setUser(user !== "" ? user : signer.address);
        setProvider(provider);
        setSigner(signer);
        setContract(contract);
        window.ethereum.on('accountsChanged', connectMetaMask);
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x7a69' }], // hardhat node
            // params: [{ chainId: '0xaa36a7' }], // Sepolia testnet
        });
        contract.on("setNicknameEvent", (address, nickname) => {
            console.log("Got new nickname: " + nickname);
            if (address === signer.address) {
                setUser(nickname);
            }
        });
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

    async function setFingerprint(fingerprint: string) {
        try {
            const tx = await contract.setFingerprint(fingerprint);
            await tx.wait();
        } catch (err) {
            alertErr(err);
        }
    }

    async function setNickname(nickname: string) {
        try {
            const tx = await contract.setNickname(nickname);
            await tx.wait();
        } catch (err) {
            alertErr(err);
        }
    }

    async function newCall(call_id: string) {
        try {
            const tx = await contract.newCall(call_id);
            await tx.wait();
        } catch (err) {
            alertErr(err);
        }
    }

    async function isAdmitted(call_id: string, address: string): Promise<Boolean> {
        try {
            const out = await contract.isAdmitted(call_id, address);
            return out;
        } catch (err) {
            alertErr(err);
        }
    }

    async function isAdmin(call_id: string, address: string): Promise<Boolean> {
        try {
            const out = await contract.isAdmin(call_id, address);
            return out;
        } catch (err) {
            alertErr(err);
        }
    }

    async function newCallWithUsers(call_id: string, users: string[], admins: string[]): Promise<Boolean> {
        try {
            const tx = await contract.newCall(call_id, users, admins);
            await tx.wait();
            return true;
        } catch (err) {
            alertErr(err);
            return false;
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
            alertErr(err);
        }
    }

    async function roomExists(call_id: string): Promise<Boolean> {
        try {
            const host: string = await contract.getHost(call_id);
            if (host === ZeroAddress) {
                return false;
            } else {
                return true;
            }
        } catch (err) {
            alertErr(err);
        }
    }

    return (
        <Blockchain.Provider value={{
            signer,
            provider,
            contract,
            user,
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
            roomExists,
            isAdmitted,
            isAdmin,
        }}>
            {children}
        </Blockchain.Provider>
    )
}

function alertErr(err: any) {
    if (err.reason) {
        alert(err.reason);
    } else {
        alert("Something went wrong");
        console.log(err);
        throw err;
    }
}
