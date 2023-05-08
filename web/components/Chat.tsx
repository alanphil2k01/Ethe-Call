import React, { MutableRefObject, DragEvent } from "react";
import styles from "./Chat.module.css"; // Import the CSS module
import Message from "./Message";
import { MessageContent } from "@/types/message";

export default function Chat ({ msgs, chatInputRef, sendChatMsg, onDrop }: {
    msgs: MessageContent[],
    chatInputRef: MutableRefObject<HTMLInputElement>
    sendChatMsg: () => void,
    onDrop: (event: DragEvent<HTMLDivElement>) => void,
}) {

  return (
        <div id={`${styles.messages}`} onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
        {/*
            <Message message="Convert RGB colors to HEX when styling using HTML & CSS"></Message>
            <Message message="Convert RGB colors to HEX when styling using HTML & CSS"></Message>
            <Message message="Convert RGB colors to HEX when styling using HTML & CSS"></Message>
        */}
            {msgs.map((msg: MessageContent, index: React.Key) => (
              <Message key={index} message={msg} />
            ))}
            <form id={`${styles.message__form}`} onSubmit={(event) => event.preventDefault()}>
                <input type="text" name="message" placeholder="Send a message...." ref={chatInputRef} onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    sendChatMsg();
                  }
                }}/>
                {/* <svg width="100px" height="100px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M20 12L4 4L6 12M20 12L4 20L6 12M20 12H6" stroke="#ffffff" stroke-width="0.792" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg> */}
            </form>
        </div>
    );
};
