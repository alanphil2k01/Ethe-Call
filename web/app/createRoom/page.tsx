'use client';

import { ChangeEvent, useRef, useState } from 'react';
import "./design.css";
import { Blockchain } from "@/app/blockchain";
import { useContext } from 'react';
import { ZeroAddress, isAddress } from 'ethers';
import { useRouter } from 'next/navigation';

type UserInput = {
    user: string;
    admin: boolean;
}

export default function users() {
    const router = useRouter();
    const [selectedNumber, setSelectedNumber] = useState(1);
    const [callId, setCallId] = useState<string>("");
    const users = useRef<UserInput[]>(Array(100).fill({ user: "", admin: false }));
    const { loadedWeb3, newCallWithUsers, nicknameToAddress, getHost } = useContext(Blockchain);

    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        setSelectedNumber(Number(event.target.value));
    };

    function changeuser(i: number, new_val: string) {
        users.current[i].user = new_val;
    }

    const createTextFields = () => {
        const textFields = [];
        for (let i = 0; i < selectedNumber; i++) {
            textFields.push(
            <div className="div1" key={i}>
                <label className="label1" htmlFor={`text-${i}`}>User nickname {i+1}:</label>
                <input value={users[i]} onChange={(event: ChangeEvent<HTMLInputElement>) => changeuser(i, event.target.value)} className="input1" type="text" />
            </div>
      );
    }
    return textFields;
  };

    const options = [];
    for (let i = 1; i <= 100; i++) {
        options.push(
            <option key={i} value={i}>
                {i}
            </option>
        );
    }

    async function createRoom(call_id: string) {
        if (call_id === "") {
            alert("Please enter a call ID");
            return;
        }
        if (!loadedWeb3) {
            alert("Please connect your Meteamask Wallet");
            return;
        }
        const nameList = users.current.slice(0, selectedNumber);

        const userList = (await Promise.all(nameList.map(async (name) => {
            if (!isAddress(name.user)) {
                const addr = await nicknameToAddress(name.user);
                if (!name.admin && addr !== ZeroAddress) {
                    console.log(`Address of ${name.user} is ${addr}`);
                    return addr;
                }
            } else {
                return name.user;
            }
        }))).filter((user) => user);

        const adminList = (await Promise.all(nameList.map(async (name) => {
            if (!isAddress(name.user)) {
                const addr = await nicknameToAddress(name.user);
                if (name.admin && addr !== ZeroAddress) {
                    console.log(`Address of ${name.user} is ${addr}`);
                    return addr;
                }
            } else {
                return name.user;
            }
        }))).filter((user) => user);

        await newCallWithUsers(call_id, userList, adminList);

        router.push(`/room2/${call_id}`);
    }

    function test() {
        getHost(callId).then((host) => console.log(host));
    }

  return (
    <div className="main">
        <div className="div2">
            <label className="label2" htmlFor="number">Select number of users in the call :</label>
            <select className="select" id="number" value={selectedNumber} onChange={handleChange}>
                {options}
            </select>
            {createTextFields()}
        </div>
        <label className="label1">Call ID</label>
        <input required type="text" onChange={(event) => setCallId(event.target.value)} />
    <button onClick={() => createRoom(callId)}>Createe Room</button>
    <button onClick={test}>test</button>
    </div>
  );

}
