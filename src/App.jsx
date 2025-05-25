import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Upload,
  Send,
  Mic,
  MicOff,
  FileText,
  Image,
  Trash2,
  User,
  MessageCircle,
  Settings,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  UserPenIcon,
  EarOff,
  Ear,
} from "lucide-react";

import SidebarToggle from "./components/SidebarToggle";

const AvatarChatApp = () => {
  const [avatars, setAvatars] = useState([]);
  const [activeAvatar, setActiveAvatar] = useState(null);
  const [messages, setMessages] = useState({});
  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAvatarName, setNewAvatarName] = useState("");
  const [newAvatarDescription, setNewAvatarDescription] = useState("");
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Auto scroll to bottom when messages change for active avatar
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeAvatar]);

  // Keyboard shortcut: Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarVisible((v) => !v);
      }
      if (e.key === "Enter" && !e.shiftKey && activeAvatar) {
        e.preventDefault();
        sendMessage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputMessage, activeAvatar]);

  const createAvatar = () => {
    if (!newAvatarName.trim()) return;

    const newAvatar = {
      id: Date.now(),
      name: newAvatarName.trim(),
      description: newAvatarDescription.trim(),
      documents: [],
      images: [],
      createdAt: new Date().toISOString(),
    };

    setAvatars((prev) => [...prev, newAvatar]);
    setMessages((prev) => ({ ...prev, [newAvatar.id]: [] }));
    setActiveAvatar(newAvatar); // Auto-select new avatar
    setNewAvatarName("");
    setNewAvatarDescription("");
    setShowCreateModal(false);
  };

  const deleteAvatar = (avatarId) => {
    setAvatars((prev) => prev.filter((a) => a.id !== avatarId));
    setMessages((prev) => {
      const copy = { ...prev };
      delete copy[avatarId];
      return copy;
    });
    if (activeAvatar?.id === avatarId) {
      setActiveAvatar(null);
    }
  };

  const handleFileUpload = (event) => {
    if (!activeAvatar) return;

    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setAvatars((prev) =>
      prev.map((avatar) => {
        if (avatar.id === activeAvatar.id) {
          const newFiles = files.map((file) => ({
            id: Date.now() + Math.random(),
            name: file.name,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          }));

          const isImage = (type) => type.startsWith("image/");
          const newDocuments = newFiles.filter((f) => !isImage(f.type));
          const newImages = newFiles.filter((f) => isImage(f.type));

          return {
            ...avatar,
            documents: [...avatar.documents, ...newDocuments],
            images: [...avatar.images, ...newImages],
          };
        }
        return avatar;
      })
    );

    // Add system message about upload
    const uploadMessage = {
      id: Date.now(),
      content: `Uploaded ${files.length} file(s): ${files
        .map((f) => f.name)
        .join(", ")}`,
      sender: "system",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => ({
      ...prev,
      [activeAvatar.id]: [...(prev[activeAvatar.id] || []), uploadMessage],
    }));

    // Clear file input value so same files can be uploaded again if needed
    event.target.value = "";
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !activeAvatar) return;

    const userMessage = {
      id: Date.now(),
      content: inputMessage.trim(),
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    const avatarResponse = {
      id: Date.now() + 1,
      content: `Hello! I'm ${
        activeAvatar.name
      }. I received your message: "${inputMessage.trim()}". I have access to ${
        activeAvatar.documents.length
      } documents and ${
        activeAvatar.images.length
      } images to help answer your questions.`,
      sender: "avatar",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => ({
      ...prev,
      [activeAvatar.id]: [
        ...(prev[activeAvatar.id] || []),
        userMessage,
        avatarResponse,
      ],
    }));

    setInputMessage("");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/wav" });
        handleVoiceMessage(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceMessage = (audioBlob) => {
    if (!activeAvatar) return;

    const voiceMessage = {
      id: Date.now(),
      content: "[Voice Message]",
      sender: "user",
      timestamp: new Date().toISOString(),
      isVoice: true,
      audioBlob, // could be used for playback
    };

    const avatarResponse = {
      id: Date.now() + 1,
      content: `I received your voice message! As ${activeAvatar.name}, I would process your audio and respond accordingly. I have ${activeAvatar.documents.length} documents and ${activeAvatar.images.length} images in my knowledge base.`,
      sender: "avatar",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => ({
      ...prev,
      [activeAvatar.id]: [
        ...(prev[activeAvatar.id] || []),
        voiceMessage,
        avatarResponse,
      ],
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="w-screen h-screen flex flex-col p-6 min-h-screen">
        {/* Header */}
        <div className="flex justify-start items-center mb-6 gap-6">
          {/* Sidebar toggle button */}
          <button
            onClick={() => setSidebarVisible((v) => !v)}
            className="bg-cyan-500 text-white w-16 h-12 items-center justify-center group transition-all duration-300 ease-in-out focus:outline focus:outline-2 focus:outline-cyan-400"
            aria-label={sidebarVisible ? "Close Sidebar" : "Open Sidebar"}
          >
            {sidebarVisible ? (
              <PanelLeftCloseIcon className="flex w-6 h-6" />
            ) : (
              <PanelLeftOpenIcon className="flex w-6 h-6" />
            )}
          </button>

          <h1 className="text-2xl font-semibold">Chat Studio</h1>
        </div>

        <div className="flex flex-row flex-grow overflow-hidden rounded-lg border border-gray-800 shadow-lg">
          {/* Sidebar */}
          {sidebarVisible && (
            <div className="w-64 bg-gray-800 p-4 overflow-y-auto flex flex-col gap-4">
              {/* Create Avatar */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-sm uppercase font-semibold text-center bg-cyan-500 py-2 rounded hover:bg-cyan-600 transition-colors focus:outline focus:outline-2 focus:outline-cyan-400 w-15"
              >
                <UserPenIcon className="w-6 h-6" />
              </button>

              {/* Avatars List */}
              <div className="flex flex-col gap-2 mt-2">
                {avatars.length === 0 && (
                  <div className="text-sm text-gray-400 text-center">
                    No avatars yet.
                  </div>
                )}
                {avatars.map((avatar) => (
                  <div
                    key={avatar.id}
                    onClick={() => setActiveAvatar(avatar)}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors duration-300 ${
                      activeAvatar?.id === avatar.id
                        ? "bg-cyan-600 text-white"
                        : "hover:bg-cyan-700 text-gray-300"
                    } focus:outline focus:outline-2 focus:outline-cyan-400`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setActiveAvatar(avatar);
                      if (e.key === "Delete") deleteAvatar(avatar.id);
                    }}
                  >
                    <User className="w-6 h-6" />
                    <div className="flex flex-col flex-grow">
                      <span className="font-semibold">{avatar.name}</span>
                      <span className="text-xs text-gray-400 truncate">
                        {avatar.description}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAvatar(avatar.id);
                      }}
                      className="text-red-400 hover:text-red-600 focus:outline focus:outline-2 focus:outline-red-400"
                      aria-label={`Delete avatar ${avatar.name}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Chat Section */}
          <div className="flex flex-col flex-grow bg-gray-900 rounded-lg p-4 overflow-hidden">
            {!activeAvatar && (
              <div className="flex-1 flex items-center justify-center bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20">
                <div className="text-center">
                  <User size={64} className="mx-auto mb-4 text-gray-400" />
                  <h2 className="text-2xl font-semibold mb-2">
                    Select an Avatar
                  </h2>
                  <p className="text-gray-400">
                    Choose an avatar from the sidebar or create a new one to
                    start chatting
                  </p>
                </div>
              </div>
            )}

            {activeAvatar && (
              <>
                {/* Messages */}
                <div
                  className="flex-grow overflow-y-auto mb-4 space-y-2 px-2"
                  aria-live="polite"
                  aria-atomic="false"
                >
                  {(messages[activeAvatar.id] || []).map((msg) => (
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
                        <audio
                          controls
                          src={URL.createObjectURL(msg.audioBlob)}
                        />
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

                {/* File Upload and Input */}
                <div className="flex gap-2 items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    aria-label="Upload files"
                  />
                  <button
                    onClick={() =>
                      fileInputRef.current && fileInputRef.current.click()
                    }
                    className="bg-cyan-500 p-2 rounded hover:bg-cyan-600 transition-colors focus:outline focus:outline-2 focus:outline-cyan-400"
                    aria-label="Upload files"
                  >
                    <Upload className="w-6 h-6" />
                  </button>

                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2 rounded transition-colors focus:outline focus:outline-2 ${
                      isRecording
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-cyan-500 hover:bg-cyan-600"
                    }`}
                    aria-label={
                      isRecording ? "Stop recording" : "Start recording"
                    }
                  >
                    {isRecording ? (
                      <EarOff className="w-6 h-6" />
                    ) : (
                      <Ear className="w-6 h-6" />
                    )}
                  </button>

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
                    className="flex-grow min-w-0 rounded px-3 py-2 bg-gray-800 border border-gray-700 focus:outline focus:outline-2 focus:outline-cyan-400 text-white"
                    aria-label="Message input"
                  />

                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2 rounded transition-colors focus:outline focus:outline-2 ${
                      isRecording
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-cyan-500 hover:bg-cyan-600"
                    }`}
                    aria-label={
                      isRecording ? "Stop recording" : "Start recording"
                    }
                  >
                    {isRecording ? (
                      <MicOff className="w-6 h-6" />
                    ) : (
                      <Mic className="w-6 h-6" />
                    )}
                  </button>
                  <button
                    onClick={sendMessage}
                    className="bg-cyan-500 p-2 rounded hover:bg-cyan-600 transition-colors focus:outline focus:outline-2 focus:outline-cyan-400"
                    aria-label="Send message"
                  >
                    <Send className="w-6 h-6" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Create Avatar Modal */}
        {showCreateModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-avatar-title"
          >
            <div className="bg-gray-900 p-6 rounded-lg w-96 max-w-full">
              <h2
                id="create-avatar-title"
                className="text-xl font-semibold mb-4 text-white"
              >
                <div className="flex items-center gap-2">
                  <UserPenIcon className="w-6 h-6" />
                  <span>Create Avatar</span>
                </div>
              </h2>
              <label className="block mb-2 text-sm text-gray-300">
                Name
                <input
                  type="text"
                  value={newAvatarName}
                  onChange={(e) => setNewAvatarName(e.target.value)}
                  className="w-full p-2 mt-1 rounded bg-gray-800 border border-gray-700 focus:outline focus:outline-2 focus:outline-cyan-400 text-white"
                  autoFocus
                  aria-required="true"
                />
              </label>
              <label className="block mb-4 text-sm text-gray-300">
                Description
                <textarea
                  value={newAvatarDescription}
                  onChange={(e) => setNewAvatarDescription(e.target.value)}
                  className="w-full p-2 mt-1 rounded bg-gray-800 border border-gray-700 focus:outline focus:outline-2 focus:outline-cyan-400 text-white"
                  rows={3}
                  aria-multiline="true"
                />
              </label>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors focus:outline focus:outline-2 focus:outline-cyan-400"
                >
                  Cancel
                </button>
                <button
                  onClick={createAvatar}
                  className="px-4 py-2 bg-cyan-600 rounded hover:bg-cyan-700 transition-colors focus:outline focus:outline-2 focus:outline-cyan-400"
                  disabled={!newAvatarName.trim()}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarChatApp;
