import React, { useEffect, useRef, useState } from "react";

const LiveTranscriptionTicker = ({ isTranscribing }) => {
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);
  const tickerRef = useRef(null);
  const scrollAnimationRef = useRef(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      console.warn("SpeechRecognition API not supported in this browser");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      // Update with combined final + interim for smoothness
      setTranscript((prev) => (finalTranscript || interimTranscript) || prev);
    };

    recognition.onerror = (event) => {
      console.error("SpeechRecognition error", event.error);
    };

    recognitionRef.current = recognition;

    if (isTranscribing) {
      recognition.start();
    }

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [isTranscribing]);

  // Scrolling ticker animation logic: scroll text left continuously
  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;

    // Cancel previous animation frame
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
    }

    let scrollPos = 0;

    const animateScroll = () => {
      if (!ticker) return;

      scrollPos += 1; // Scroll speed, adjust as needed
      if (scrollPos > ticker.scrollWidth) {
        scrollPos = 0;
      }
      ticker.scrollLeft = scrollPos;
      scrollAnimationRef.current = requestAnimationFrame(animateScroll);
    };

    if (isTranscribing) {
      animateScroll();
    } else {
      ticker.scrollLeft = 0;
      cancelAnimationFrame(scrollAnimationRef.current);
    }

    return () => {
      cancelAnimationFrame(scrollAnimationRef.current);
    };
  }, [isTranscribing, transcript]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={`relative overflow-hidden whitespace-nowrap
        px-3 py-2 rounded border border-gray-700 bg-black/40
        text-white text-base font-sans select-none
        transition-opacity duration-500 mb-2 rounded-xl flex items-center
        ${isTranscribing ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
      style={{ height: "80px", userSelect: "none" }} // match input bar height approx
      role="region"
      aria-label="Live transcription ticker"
    >
      <div
        ref={tickerRef}
        style={{
          whiteSpace: "nowrap",
          overflowX: "hidden",
          display: "inline-block",
          willChange: "scrollLeft",
        }}
      >
        {transcript || "Listening..."}
      </div>
    </div>
  );
};

export default LiveTranscriptionTicker;
