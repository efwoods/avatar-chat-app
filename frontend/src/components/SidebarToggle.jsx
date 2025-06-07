import React from "react";
import { User, Trash2, Sidebar } from "lucide-react";

export default function SidebarToggle({
  avatars,
  activeAvatar,
  setActiveAvatar,
  deleteAvatar,
}) {
  return (
    <div className="w-80 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 ">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <User size={20} />
        Your Avatars
      </h2>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {avatars.map((avatar) => (
          <div
            key={avatar.avatar_id}
            className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
              activeAvatar?.avatar_id === avatar.avatar_id
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
                  deleteAvatar(avatar.avatar_id);
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
  );
}
