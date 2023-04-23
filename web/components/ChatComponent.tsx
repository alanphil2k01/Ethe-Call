
import React from "react";



const ChatComponent = ({ msgs, chatInputRef, sendChatMsg }) => {
  return (
    <div>
      <ul>
        {msgs.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
      <input
        type="text"
        ref={chatInputRef}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            sendChatMsg();
          }
        }}
      />
      <button onClick={sendChatMsg}>Send</button>
    </div>
  );
};


export default ChatComponent;
