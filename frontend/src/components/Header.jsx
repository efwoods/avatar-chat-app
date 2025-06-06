import React from "react";
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import NeuralNexusLogo from '../assets/NeuralNexus.png';
import AuthComponent from "./AuthComponent";

const Header = ({ sidebarVisible, setSidebarVisible }) => {
  return (
    <div className="flex justify-between items-center mb-6 gap-6">
      {/* Left side: sidebar toggle + logo + titles */}
      <div className="flex items-center gap-6">

      <button
        onClick={() => setSidebarVisible((v) => !v)}
        className="transition-transform duration-300 hover:scale-105 px-4 py-2 rounded hover:bg-cyan-600 transition-colors focus:outline focus:outline-2 focus:outline-cyan-400 min-w-0 rounded px-3 py-2 border border-gray-700 text-white bg-black/35 from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6 py-3 rounded-xl flex font-semibold gap-2 transition-all duration-300 transform shadow-lg items-center justify-center"
        aria-label={sidebarVisible ? "Close Sidebar" : "Open Sidebar"}
        >
        {sidebarVisible ? (
          <PanelLeftCloseIcon className="flex w-6 h-6" />
        ) : (
          <PanelLeftOpenIcon className="flex w-6 h-6" />
        )}
      </button>
      <h1 className="text-2xl font-semibold">Neural</h1>
      <img src={NeuralNexusLogo} alt="Logo" className="w-20 h-20 bg-transparent" />
      <h1 className="text-2xl font-semibold">Nexus</h1>
      </div>
      <div>
        <AuthComponent/>
      </div>
    </div>

  );
};

export default Header;