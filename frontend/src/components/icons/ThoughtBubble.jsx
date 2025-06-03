// src/components/icons/ThoughtBubble.jsx
import React from "react";

const ThoughtBubble = ({ size = 10, color = "currentColor", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M8 18a5 5 0 0 1-1-9.9 7 7 0 0 1 13.4 2A4.5 4.5 0 0 1 19 18H8z" />
    <circle cx="7" cy="20" r="1" />
    <circle cx="3.5" cy="22" r=".5" />
  </svg>
);

export default ThoughtBubble;
