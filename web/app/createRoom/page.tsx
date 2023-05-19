'use client';

import { ChangeEvent, useRef, useState } from 'react';
import styles from "./page.module.css";
import { Blockchain } from "@/app/blockchain";
import { useContext } from 'react';
import { ZeroAddress, isAddress } from 'ethers';
import { useRouter } from 'next/navigation';
import { Fingerprint } from '../fingerprint';

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
            // <div className="div1" key={i}>
            //     <label className="label1" htmlFor={`text-${i}`}>User {i+1}:</label>
            //     <input value={users[i]} placeholder="nickname or address" onChange={(event) => users.current[i] = event.target.value} className="input1 placeholder-gray-500 placeholder-opacity-80" type="text" />
            // </div>
            <div className={`${styles.form__field__wrapper}`} key={i}>
                <label htmlFor={`text-${i}`}>User {i+1}: </label>
                <input type="text" name="room" required placeholder="Username or address"  value={users[i]} onChange={(event) => users.current[i] = event.target.value}/>
            </div>
      );
    }
    return textFields;
  };

    const options = [];
    for (let i = 1; i <= 10; i++) {
        options.push(
            <option key={i} value={i}>
                {i}
            </option>
        );
    }

    const {certificates} = useContext(Fingerprint);
    async function createRoom() {
        if (!loadedWeb3) {
            alert("Please connect your Meteamask Wallet");
            return;
        }
        if (roomID === "") {
            alert("Please enter a call ID");
            //router.push(`/room2/123`);
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
                if(certificates.length === 0){
                    alert("Room created successfully. Redirecting to home");
                    router.push('/');
                }else{
                    router.push(`/room2/${roomID}`);
                }    
        }

    }

  return (
    // <div className="main">
    //     <div className="flex flex-row mt-4 items-center w-full justify-around">
    //         <div className="">
    //             <label className="label1">Room ID: </label>
    //             <input placeholder="Room ID" required className="input1 placeholder-gray-500 placeholder-opacity-80" type="text" onChange={(event) => setRoomId(event.target.value)} />
    //         </div>
    //     </div>
    //     <div className="div2 pb-4">
    //         <label className="label2" htmlFor="number">Select number of users in the call: </label>
    //         <select className="select" id="number" value={selectedNumber} onChange={handleChange}>
    //             {options}
    //         </select>
    //         {createTextFields()}
    //     </div>
    // </div>
    <main id={`${styles.room__lobby__container}`}>
        <div id={`${styles.form__container}`}>
              <div id={`${styles.form__container__header}`}>
                  <p className={`${styles.text}`}>👋 Set call details</p>
              </div>

              <form id={`${styles.lobby__form}`} onSubmit={(event) => {event.preventDefault()}}>
                  <div className={`${styles.form__field__wrapper}`}>
                    <input placeholder="Room ID" required type="text" onChange={(event) => setRoomId(event.target.value)} />
                    <span style={{display: "flex", flexDirection: "row"}}>
                        <label htmlFor="number">Select number of users in the call: </label>
                        <select className="select" id="number" value={selectedNumber} onChange={handleChange} style={{backgroundColor: '#3f434a', marginTop: 10,height: "1.7em", width: 50}}>
                            {options}
                        </select>
                    </span>
                    {createTextFields()}
                <button onClick={createRoom}>Create Room</button>
                </div>
              </form>
            </div>
        </main>
    );

}
