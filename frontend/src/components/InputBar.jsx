import React from "react";
import { Send } from "lucide-react";

const InputBar = ({ inputMessage, setInputMessage, sendMessage, dataExchangeTypes }) => {
  return (
    <>
      {dataExchangeTypes.text && (
        <input
          type="text"
          placeholder="Type a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          className="flex-grow min-w-0 rounded px-3 py-2 border border-gray-700 focus:outline focus:outline-2 focus:outline-cyan-400 text-white bg-black/35 from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 transform shadow-lg"
          aria-label="Message input"
        />
      )}
      <button
        onClick={sendMessage}
        className="px-4 py-2 rounded hover:bg-cyan-600 transition-colors focus:outline focus:outline-2 focus:outline-cyan-400 min-w-0 rounded px-3 py-2 border border-gray-700 text-white bg-black/35 from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6 py-3 rounded-xl flex font-semibold gap-2 transition-all duration-300 transform shadow-lg items-center justify-center"
        aria-label="Send message"
        disabled={!dataExchangeTypes.text}
      >
        <Send className="w-6 h-6" />
      </button>
    </>
  );
};

export default InputBar;