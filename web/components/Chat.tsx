import React, { MutableRefObject, useRef, useEffect } from "react";
import styles from "./Chat.module.css"; // Import the CSS module
import Message from "./Message";
import { MessageContent } from "@/types/message";

export default function Chat ({ msgs, chatInputRef, sendChatMsg, sendFiles, closeHandler}: {
    msgs: MessageContent[],
    chatInputRef: MutableRefObject<HTMLInputElement>
    sendChatMsg: () => void,
    sendFiles: (files: File[]) => void,
    closeHandler: () => void,
}) {
  const chatRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
    const isScrolledToBottom = ((scrollTop + clientHeight)/scrollHeight)*100 >= 92;
      if (isScrolledToBottom) {
        chatRef.current.scrollTop = scrollHeight;
      }
  }, [msgs]);

  return (
        <div id={`${styles.messages}`}  onDrop={(event) => {
            event.preventDefault();
            const files = Array.from(event.dataTransfer.files);
            if (files.length > 0) {
                sendFiles(files);
            }
        }} onDragOver={(e) => e.preventDefault()}>
            <button id={`${styles.closeBtn}`} onClick={closeHandler}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>
            </button>
            <div id={`${styles.messages_container}`} ref={chatRef}>
                {msgs.map((msg: MessageContent, index: React.Key) => (
                  <Message key={index} message={msg} />
                ))}
            </div>
            <form id={`${styles.message__form}`} onSubmit={(event) => event.preventDefault()}>
                <input type="text" name="message" placeholder="Send a message or drop files here..." ref={chatInputRef} onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    sendChatMsg();
                  }
                }}/>
                <label id={`${styles.multi_file_input}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V160H256c-17.7 0-32-14.3-32-32V0H64zM256 0V128H384L256 0zM216 408c0 13.3-10.7 24-24 24s-24-10.7-24-24V305.9l-31 31c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l72-72c9.4-9.4 24.6-9.4 33.9 0l72 72c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-31-31V408z"/></svg>
                    <input type="file" multiple name="files" onChange={(event) => {
                        event.preventDefault();
                        const files = Array.from(event.target.files);
                        if (files.length > 0) {
                            sendFiles(files);
                        }
                    }} />
                </label>
            </form>
        </div>
    );
};
