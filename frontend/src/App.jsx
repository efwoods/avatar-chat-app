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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import SidebarToggle from "./components/SidebarToggle";
import LiveTranscriptionTicker from "./components/LiveTranscriptionTicker";
import AudioStreamer from "./components/AudioStreamer";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import CreateAvatarModal from "./components/CreateAvatarModal";
import { useNgrokApiUrl } from "./context/NgrokAPIContext";


const AvatarChatApp = () => {
  const [avatars, setAvatars] = useState([]);
  const [activeAvatar, setActiveAvatar] = useState(null);
  const [messages, setMessages] = useState({});
  const [inputMessage, setInputMessage] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAvatarName, setNewAvatarName] = useState("");
  const [newAvatarDescription, setNewAvatarDescription] = useState("");
  const [showDataExchangeDropdown, setShowDataExchangeDropdown] = useState(false);
  const [dataExchangeTypes, setDataExchangeTypes] = useState({
    text: true,
    voice: true,
    fileUpload: true,
    custom: true,
    neuralText: true,
    neuralImage: true,
    neuralMotion: true,
    blueToothControl: true,
    telepathy: true
  });
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const sourceRef = useRef(null);
  const processorRef = useRef(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const {ngrokHttpsUrl, ngrokWsUrl} = useNgrokApiUrl();

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeAvatar]);

  // Handle keyboard shortcuts and dropdown close on click outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarVisible((v) => !v);
      }
      if (e.key === "Enter" && !e.shiftKey && activeAvatar && dataExchangeTypes.text) {
        e.preventDefault();
        sendMessage();
      }
      if (e.key === "Escape") {
        setShowDataExchangeDropdown(false);
      }
    };

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDataExchangeDropdown(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [inputMessage, activeAvatar, dataExchangeTypes.text]);

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
    setMessages((prev) => ({ ...prev, [newAvatar.avatar_id]: [] }));
    setActiveAvatar(newAvatar);
    setNewAvatarName("");
    setNewAvatarDescription("");
    setShowCreateModal(false);
  };

  const deleteAvatar = (avatarId) => {
    setAvatars((prev) => prev.filter((a) => a.avatar_id !== avatarId));
    setMessages((prev) => {
      const copy = { ...prev };
      delete copy[avatarId];
      return copy;
    });
    if (activeAvatar?.avatar_id === avatarId) {
      setActiveAvatar(null);
    }
  };

  const handleFileUpload = (event) => {
    if (!activeAvatar || !dataExchangeTypes.fileUpload) return;
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setAvatars((prev) =>
      prev.map((avatar) => {
        if (avatar.avatar_id === activeAvatar.id) {
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

    const uploadMessage = {
      id: Date.now(),
      content: `Uploaded ${files.length} file(s): ${files.map((f) => f.name).join(", ")}`,
      sender: "system",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => ({
      ...prev,
      [activeAvatar.id]: [...(prev[activeAvatar.id] || []), uploadMessage],
    }));
    event.target.value = "";
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !activeAvatar || !dataExchangeTypes.text) return;
    const userMessage = {
      id: Date.now(),
      content: inputMessage.trim(),
      sender: "user",
      timestamp: new Date().toISOString(),
    };
    const avatarResponse = {
      id: Date.now() + 1,
      content: `Hello! I'm ${activeAvatar.name}. I received your message: "${inputMessage.trim()}". I have access to ${activeAvatar.documents.length} documents and ${activeAvatar.images.length} images to help answer your questions.`,
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
    if (!dataExchangeTypes.voice) return;
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
      setIsTranscribing(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isTranscribing) {
      mediaRecorderRef.current.stop();
      setIsTranscribing(false);
    }
  };

  const handleVoiceMessage = (audioBlob) => {
    if (!activeAvatar || !dataExchangeTypes.voice) return;
    const voiceMessage = {
      id: Date.now(),
      content: "[Voice Message]",
      sender: "user",
      timestamp: new Date().toISOString(),
      isVoice: true,
      audioBlob,
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

  const startTranscription = async () => {
    if (!dataExchangeTypes.voice) return;
    const wsUrl = ngrokWsUrl + '/transcription/ws';
    const ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = async () => {
      console.log("WebSocket connection opened");
      setIsTranscribing(true);
      audioContextRef.current = new AudioContext();
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      sourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const downsampled = downsampleBuffer(input, audioContextRef.current.sampleRate, 16000);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(downsampled);
        }
      };

      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const text = data.transcript;
        if (typeof text === "string" && text.trim() !== "") {
          document.dispatchEvent(new CustomEvent("transcription", { detail: text }));
        } else {
          console.warn("Empty or invalid transcript received:", data);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error, event.data);
      }
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);
    ws.onclose = () => {
      console.log("WebSocket closed");
      setIsTranscribing(false);
    };
  };

  const stopTranscription = () => {
    setIsTranscribing(false);
    if (processorRef.current) processorRef.current.disconnect();
    if (sourceRef.current) sourceRef.current.disconnect();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) audioContextRef.current.close();
    if (wsRef.current) wsRef.current.close();
  };

  function downsampleBuffer(buffer, inputSampleRate, outputSampleRate) {
    const sampleRateRatio = inputSampleRate / outputSampleRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Int16Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const sample = buffer[Math.floor(i * sampleRateRatio)];
      result[i] = Math.max(-32768, Math.min(32767, sample * 0x7FFF));
    }
    return result;
  }

  const toggleDataExchangeType = (type) => {
    setDataExchangeTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
    if (type === "voice" && !dataExchangeTypes.voice && isTranscribing) {
      stopTranscription();
      stopRecording();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-green-900 text-white">
      <div className="w-screen h-screen flex flex-col p-6 min-h-screen">
        <Header sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />
        <div className="flex flex-row flex-grow overflow-hidden rounded-2xl shadow-lg gap-x-4">
          {sidebarVisible && (
            <Sidebar
              avatars={avatars}
              activeAvatar={activeAvatar}
              setActiveAvatar={setActiveAvatar}
              deleteAvatar={deleteAvatar}
              setShowCreateModal={setShowCreateModal}
            />
          )}
          <ChatArea
            activeAvatar={activeAvatar}
            messages={messages}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            isTranscribing={isTranscribing}
            dataExchangeTypes={dataExchangeTypes}
            fileInputRef={fileInputRef}
            messagesEndRef={messagesEndRef}
            dropdownRef={dropdownRef}
            showDataExchangeDropdown={showDataExchangeDropdown}
            setShowDataExchangeDropdown={setShowDataExchangeDropdown}
            handleFileUpload={handleFileUpload}
            sendMessage={sendMessage}
            startTranscription={startTranscription}
            stopTranscription={stopTranscription}
            toggleDataExchangeType={toggleDataExchangeType}
          />
        </div>
        {showCreateModal && (
          <CreateAvatarModal
            newAvatarName={newAvatarName}
            setNewAvatarName={setNewAvatarName}
            newAvatarDescription={newAvatarDescription}
            setNewAvatarDescription={setNewAvatarDescription}
            createAvatar={createAvatar}
            setShowCreateModal={setShowCreateModal}
          />
        )}
      </div>
    </div>
  );
};

export default AvatarChatApp;