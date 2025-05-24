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
} from "lucide-react";

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

  // Create a new avatar
  const createAvatar = () => {
    if (!newAvatarName.trim()) return;

    const newAvatar = {
      id: Date.now(),
      name: newAvatarName,
      description: newAvatarDescription,
      documents: [],
      images: [],
      createdAt: new Date().toISOString(),
    };

    setAvatars([...avatars, newAvatar]);
    setMessages((prev) => ({ ...prev, [newAvatar.id]: [] }));
    setNewAvatarName("");
    setNewAvatarDescription("");
    setShowCreateModal(false);
  };

  // Delete avatar
  const deleteAvatar = (avatarId) => {
    setAvatars(avatars.filter((a) => a.id !== avatarId));
    const newMessages = { ...messages };
    delete newMessages[avatarId];
    setMessages(newMessages);
    if (activeAvatar?.id === avatarId) {
      setActiveAvatar(null);
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    if (!activeAvatar) return;

    const files = Array.from(event.target.files);
    const updatedAvatars = avatars.map((avatar) => {
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
    });

    setAvatars(updatedAvatars);
    setActiveAvatar(updatedAvatars.find((a) => a.id === activeAvatar.id));

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
  };

  // Send text message
  const sendMessage = () => {
    if (!inputMessage.trim() || !activeAvatar) return;

    const userMessage = {
      id: Date.now(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    const avatarResponse = {
      id: Date.now() + 1,
      content: `Hello! I'm ${activeAvatar.name}. I received your message: "${inputMessage}". I have access to ${activeAvatar.documents.length} documents and ${activeAvatar.images.length} images to help answer your questions.`,
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

  // Voice recording functions
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
      <div className="container mx-auto p-6 h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Avatar Chat Studio
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Plus size={20} />
            Create Avatar
          </button>
        </div>

        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Sidebar - Avatar List */}
          <div className="w-80 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User size={20} />
              Your Avatars
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {avatars.map((avatar) => (
                <div
                  key={avatar.id}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                    activeAvatar?.id === avatar.id
                      ? "bg-gradient-to-r from-cyan-500/30 to-purple-600/30 border border-cyan-400/50"
                      : "bg-white/5 hover:bg-white/10 border border-transparent"
                  }`}
                  onClick={() => setActiveAvatar(avatar)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{avatar.name}</h3>
                      <p className="text-sm text-gray-300 mt-1">
                        {avatar.description || "No description"}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        <span>{avatar.documents.length} docs</span>
                        <span>{avatar.images.length} images</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAvatar(avatar.id);
                      }}
                      className="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {activeAvatar ? (
              <>
                {/* Avatar Info & Upload */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {activeAvatar.name}
                      </h2>
                      <p className="text-gray-300">
                        {activeAvatar.description}
                      </p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105"
                    >
                      <Upload size={18} />
                      Upload Files
                    </button>
                  </div>

                  {/* File Lists */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText size={16} />
                        Documents ({activeAvatar.documents.length})
                      </h3>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {activeAvatar.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="text-sm bg-white/5 p-2 rounded flex justify-between"
                          >
                            <span className="truncate">{doc.name}</span>
                            <span className="text-gray-400">
                              {formatFileSize(doc.size)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Image size={16} />
                        Images ({activeAvatar.images.length})
                      </h3>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {activeAvatar.images.map((img) => (
                          <div
                            key={img.id}
                            className="text-sm bg-white/5 p-2 rounded flex justify-between"
                          >
                            <span className="truncate">{img.name}</span>
                            <span className="text-gray-400">
                              {formatFileSize(img.size)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 flex flex-col">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-white/20">
                    <h3 className="font-semibold flex items-center gap-2">
                      <MessageCircle size={18} />
                      Chat with {activeAvatar.name}
                    </h3>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {(messages[activeAvatar.id] || []).map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                            message.sender === "user"
                              ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
                              : message.sender === "system"
                              ? "bg-yellow-500/20 text-yellow-200 border border-yellow-500/30"
                              : "bg-white/20 text-white border border-white/30"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          {message.isVoice && (
                            <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
                              <Mic size={12} />
                              Voice Message
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input Area */}
                  <div className="p-4 border-t border-white/20">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 bg-white/10 border border-white/30 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      />
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-2 rounded-xl transition-all duration-300 ${
                          isRecording
                            ? "bg-red-500 hover:bg-red-600 animate-pulse"
                            : "bg-purple-500 hover:bg-purple-600"
                        }`}
                      >
                        {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                      </button>
                      <button
                        onClick={sendMessage}
                        className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 p-2 rounded-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
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
          </div>
        </div>
      </div>

      {/* Create Avatar Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 w-96">
            <h2 className="text-2xl font-bold mb-4">Create New Avatar</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={newAvatarName}
                onChange={(e) => setNewAvatarName(e.target.value)}
                placeholder="Avatar Name"
                className="w-full bg-white/10 border border-white/30 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <textarea
                value={newAvatarDescription}
                onChange={(e) => setNewAvatarDescription(e.target.value)}
                placeholder="Avatar Description (optional)"
                className="w-full bg-white/10 border border-white/30 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 h-24 resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createAvatar}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-4 py-2 rounded-xl transition-all duration-300"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        accept="*/*"
      />
    </div>
  );
};

export default AvatarChatApp;
