'use client';

import { ChangeEvent, useRef, useState } from 'react';
import "./design.css";
import { Blockchain } from "@/app/blockchain";
import { useContext } from 'react';
import { ZeroAddress, isAddress } from 'ethers';
import { useRouter } from 'next/navigation';

export default function users() {
    const router = useRouter();
    const [selectedNumber, setSelectedNumber] = useState(1);
    const [roomID, setRoomId] = useState<string>("");
    const users = useRef<string[]>(new Array(100).fill(""));
    const isAdmin = useRef<Boolean[]>(new Array(100).fill(false));
    const { loadedWeb3, newCallWithUsers, nicknameToAddress, getHost } = useContext(Blockchain);

    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        setSelectedNumber(Number(event.target.value));
    };

    const createTextFields = () => {
        const textFields = [];
        for (let i = 0; i < selectedNumber; i++) {
            textFields.push(
            <div className="div1" key={i}>
                <label className="label1" htmlFor={`text-${i}`}>User {i+1}: </label>
                <input value={users[i]} placeholder="nickname or address" onChange={(event) => users.current[i] = event.target.value} className="input1 placeholder-gray-500 placeholder-opacity-80" type="text" />
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

    async function createRoom() {
        if (!loadedWeb3) {
            alert("Please connect your Meteamask Wallet");
            return;
        }
        if (roomID === "") {
            alert("Please enter a call ID");
            return;
        }

        let userList: string[] = []
        let adminList: string[] = []
        for (let i = 0; i < selectedNumber; i++) {
            let addr: string;
            if (isAddress(users.current[i])) {
                addr = users.current[i];
            } else {
                addr = await nicknameToAddress(users.current[i]);
            }
            if (addr !== ZeroAddress) {
                console.log(`Address of ${users.current[i]} is ${addr}`);
                if (isAdmin.current[i]) {
                    adminList.push(addr);
                } else {
                    userList.push(addr);
                }
            } else {
                alert(`${users.current[i]} does not exist`);
                return;
            }
        }

        console.log(userList);
        console.log(adminList);
        if ((await newCallWithUsers(roomID, userList, adminList))) {
                router.push(`/room2/${roomID}`);
        }

    }

  return (
    <div className="main">
        <div className="flex flex-row mt-4 items-center w-full justify-around">
            <div className="">
                <label className="label1">Room ID: </label>
                <input placeholder="Room ID" required className="input1 placeholder-gray-500 placeholder-opacity-80" type="text" onChange={(event) => setRoomId(event.target.value)} />
            </div>
            <button className="btn1" onClick={createRoom}>Createe Room</button>
        </div>
        <div className="div2 pb-4">
            <label className="label2" htmlFor="number">Select number of users in the call: </label>
            <select className="select" id="number" value={selectedNumber} onChange={handleChange}>
                {options}
            </select>
            {createTextFields()}
        </div>
    </div>
  );

}
