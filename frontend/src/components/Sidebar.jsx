import React from "react";
import { UserPenIcon, User, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ avatars, activeAvatar, setActiveAvatar, deleteAvatar, setShowCreateModal }) => {
  const {isLoggedIn} = useAuth();
  const displayAvatars = isLoggedIn ? avatars : [] 
  return (
    <div className="w-64 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 p-4 overflow-y-auto flex flex-col gap-4">
      {isLoggedIn && <button
        onClick={() => setShowCreateModal(true)}
        className="transition-transform duration-300 hover:scale-105 px-4 py-2 rounded hover:bg-cyan-600 transition-colors focus:outline focus:outline-2 focus:outline-cyan-400 min-w-0 rounded px-3 py-2 border border-gray-700 text-white bg-black/35 from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6 py-3 rounded-xl flex font-semibold gap-2 transition-all duration-300 transform shadow-lg items-center justify-center"
      >
        <UserPenIcon className="w-6 h-6" />
         
      </button>}
      <div className="flex flex-col gap-2 mt-2">
        {displayAvatars.length === 0 && (
          <div className="text-sm text-gray-400 text-center">
            No avatars yet.
          </div>
        )}
        {displayAvatars.map((avatar) => (
          <div
            key={avatar.avatar_id}
            onClick={() => setActiveAvatar(avatar)}
            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors duration-300 ${
              activeAvatar?.avatar_id === avatar.avatar_id
                ? "bg-white-600 text-white"
                : "hover:bg-cyan-700 text-gray-300"
            } focus:outline focus:outline-2 focus:outline-cyan-400`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") setActiveAvatar(avatar);
              if (e.key === "Delete") deleteAvatar(avatar.avatar_id);
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
                deleteAvatar(avatar.avatar_id);
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
  );
};

export default Sidebar;