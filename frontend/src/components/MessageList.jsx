import React from "react";

const MessageList = ({ messages, messagesEndRef }) => {
  return (
    <div
      className="flex-grow overflow-y-auto mb-4 space-y-2 px-2"
      aria-live="polite"
      aria-atomic="false"
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`max-w-[70%] p-2 rounded-lg ${
            msg.sender === "user"
              ? "bg-cyan-600 self-end text-white"
              : msg.sender === "avatar"
              ? "bg-gray-700 self-start text-white"
              : "bg-gray-600 self-center italic text-gray-300"
          }`}
        >
          {msg.isVoice ? (
            <audio controls src={URL.createObjectURL(msg.audioBlob)} />
          ) : (
            msg.content
          )}
          <div className="text-xs text-gray-400 mt-1 text-right select-none">
            {new Date(msg.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;