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

type BlockchainVals = {
    address: string;
    signer: JsonRpcSigner;
    contract: Contract;
    provider: BrowserProvider;
    loading: boolean;
    loadedWeb3: boolean;
    connectMetaMask: ()=>void;
}

export const Blockchain = createContext<BlockchainVals>(null);

export default function BlockchainProvider({ children }: { children: ReactNode }) {
    const [provider, setProvider] = useState<BrowserProvider>();
    const [signer, setSigner] = useState<JsonRpcSigner>();
    const [contract, setContract] = useState<Contract>();
    const [loading, isLoading] = useState(false);
    const [loadedWeb3, setLoadedWeb3] = useState(false);

    async function loadWeb3() {
        const provider = new BrowserProvider(window.ethereum)
        setProvider(provider);
        const signer = await provider.getSigner();
        setSigner(signer);
        const contract = new Contract(contract_addr, contractABI.abi, signer)
        setContract(contract);
    }

    function connectMetaMask() {
        isLoading(true);
        if (window.ethereum == null) {
        } else {
            loadWeb3()
            .then(() => setLoadedWeb3(true));
        }
        isLoading(false);
    }

    return (
        <Blockchain.Provider value={{
            address: "asdf",
            signer: signer,
            provider: provider,
            contract: contract,
            loading: loading,
            loadedWeb3: loadedWeb3,
            connectMetaMask: connectMetaMask,
        }}>
            {children}
        </Blockchain.Provider>
    )
}
