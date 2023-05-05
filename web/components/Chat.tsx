import React, { useState } from "react";
import styles from "./Chat.module.css"; // Import the CSS module
import Message from "./Message";

const Chat = ({ msgs, chatInputRef, sendChatMsg }) => {

  return (
        <div id={`${styles.messages}`}>
            <Message message="Convert RGB colors to HEX when styling using HTML & CSS"></Message>
            <Message message="Convert RGB colors to HEX when styling using HTML & CSS"></Message>
            <Message message="Convert RGB colors to HEX when styling using HTML & CSS"></Message>
            {msgs.map((msg, index) => (
                <Message message={msg}></Message>
            ))}
            <form id={`${styles.message__form}`}>
                <input type="text" name="message" placeholder="Send a message...." ref={chatInputRef} onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    sendChatMsg();
                  }
                }}/>
            </form>
        </div>
    );
};

export default Chat;