import React from "react";
import { User } from "lucide-react";
import LiveTranscriptionTicker from "./LiveTranscriptionTicker";
import AudioStreamer from "./AudioStreamer";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import DataExchangeDropdown from "./DataExchangeDropdown";

const ChatArea = ({
  activeAvatar,
  messages,
  inputMessage,
  setInputMessage,
  isTranscribing,
  dataExchangeTypes,
  fileInputRef,
  messagesEndRef,
  dropdownRef,
  showDataExchangeDropdown,
  setShowDataExchangeDropdown,
  handleFileUpload,
  sendMessage,
  startTranscription,
  stopTranscription,
  toggleDataExchangeType,
}) => {
  return (
    <div className="flex flex-col flex-grow bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 p-4 overflow-hidden">
      <LiveTranscriptionTicker isTranscribing={isTranscribing} />
      <AudioStreamer isTranscribing={isTranscribing} />
      {!activeAvatar && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20">
          <div className="text-center">
            <User size={64} className="mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-semibold mb-2">Select an Avatar</h2>
            <p className="text-gray-400">
              Choose an avatar from the sidebar or create a new one to start chatting
            </p>
          </div>
        </div>
      )}
      {activeAvatar && (
        <>
          <MessageList messages={messages[activeAvatar.id] || []} messagesEndRef={messagesEndRef} />
          <div className="flex gap-2 items-center relative">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              aria-label="Upload files"
            />
            <DataExchangeDropdown
              isTranscribing={isTranscribing}
              dataExchangeTypes={dataExchangeTypes}
              dropdownRef={dropdownRef}
              showDataExchangeDropdown={showDataExchangeDropdown}
              setShowDataExchangeDropdown={setShowDataExchangeDropdown}
              startTranscription={startTranscription}
              stopTranscription={stopTranscription}
              toggleDataExchangeType={toggleDataExchangeType}
              fileInputRef={fileInputRef}
            />
            <InputBar
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              sendMessage={sendMessage}
              dataExchangeTypes={dataExchangeTypes}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatArea;