import { useEffect, useState } from "react";
import Web3 from "web3";
import data from "../../common/EtheCall.json";
import contract_address from "../../common/contract_addr";

export function useWalletDetails() {

  async function loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should use the MetaMask extension!"
      );
    }
  }

  const [acc, setAccount] = useState();
  const [EtheCall, setEtheCall] = useState();

  const [loading, setLoading] = useState(true);

  async function loadBlockchainData() {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    setAccount(accounts[0]);
    if (contract_address) {
      const hnet = new web3.eth.Contract(data.abi, contract_address);
      setEtheCall(hnet);
      setLoading(false);
    } else {
      window.alert("The dapp contract could not be deployed to network");
    }
  }

  const init = async () => {
    await loadWeb3();
    await loadBlockchainData();
  };

  useEffect(() => {
    init();
  }, []);

  return { acc, healthNet: EtheCall, loading };
}
