import React, { useRef, useState } from "react";

const AudioStreamer = ({ isTranscribing }) => {
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const startStreaming = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });
    
    const fetch_url = import.meta.env.VITE_GITHUB_FETCH_URL_ROOT + 
                      import.meta.env.VITE_GITHUB_GIST_ID + 
                      import.meta.env.VITE_GITHUB_GIST_FILENAME +
                      "?t=" + Date.now();
    const data = await (await fetch(fetch_url, {cache: "no-store"})).text()
    console.log("data: " + data)
    wsRef.current = new WebSocket(data + "/transcription/ws");

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
          try {
            const data = JSON.parse(event.data);
            const transcript = data.transcript.trim();

            // Only dispatch actual transcript content or "Listening..." if empty
            const transcriptionText = transcript ? transcript : "Listening...";
            console.log("Received transcription:", transcriptionText);

            console.log("Received transcription:", data)
            const transcriptionEvent = new CustomEvent("transcription", { 
              detail: transcriptionText 
            });

            document.dispatchEvent(transcriptionEvent);


            console.log("Received transcription:", transcript || "Listening...");
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
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
