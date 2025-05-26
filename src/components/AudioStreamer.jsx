import React, { useRef, useState } from "react";

const AudioStreamer = ({ isTranscribing }) => {
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const startStreaming = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });

    wsRef.current = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL);

    wsRef.current.onopen = () => {
      setConnected(true);
      console.log("WebSocket connected");

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current.readyState === WebSocket.OPEN) {
          event.data.arrayBuffer().then((buffer) => {
            wsRef.current.send(buffer);
          });
        }
      };

      wsRef.current.onmessage = (event) => {
        const transcript = event.data;
        const transcriptionEvent = new CustomEvent("transcription", { detail: transcript });
        document.dispatchEvent(transcriptionEvent);
        console.log("Received transcription:", transcript);
      };

      mediaRecorderRef.current.start(250);
    };

    wsRef.current.onclose = () => {
      setConnected(false);
      console.log("WebSocket closed");
    };

    wsRef.current.onerror = (err) => {
      console.error("WebSocket error", err);
    };
  };

  const stopStreaming = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  React.useEffect(() => {
    if (isTranscribing) {
      startStreaming();
    } else {
      stopStreaming();
    }

    return stopStreaming;
  }, [isTranscribing]);

};

export default AudioStreamer;
