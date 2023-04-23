import React, { useState } from "react";
import styles from "./ChatComponent.module.css"; // Import the CSS module

const ChatComponent = ({ msgs, chatInputRef, sendChatMsg }) => {
  const [isOpen, setIsOpen] = useState(false); // State to track if chat is open or closed

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      {!isOpen && ( // Show "O" button when chat is closed
        <button onClick={toggleChat} className={styles.openButton}>
         Open Chat
        </button>
      )}
      {isOpen && ( // Show chat window when chat is open
        <div className={styles.container}>
          <div className={styles.titleBar}>
            <h3 className={styles.title}>Chat</h3> {/* Added "Chat" heading */}
            <button
              onClick={toggleChat}
              className={`${styles.closeButton} ${styles.topRight}`}
            >
              X
            </button>
          </div>
          <div className={styles.chatContainer}>
            {/* Chat messages */}
            <ul className={styles.list}>
              {msgs.map((msg, index) => (
                <li key={index} className={styles.li}>
                  {msg}
                </li>
              ))}
            </ul>
            {/* Chat input and Send button */}
            <div className={styles.inputContainer}>
              <input
                type="text" placeholder="Enter chat"
                ref={chatInputRef}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    sendChatMsg();
                  }
                }}
                className={styles.input}
              />
              <button onClick={sendChatMsg} className={styles.button}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatComponent;
