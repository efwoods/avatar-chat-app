import React from "react";
import { UserPenIcon } from "lucide-react";

const CreateAvatarModal = ({
  newAvatarName,
  setNewAvatarName,
  newAvatarDescription,
  setNewAvatarDescription,
  createAvatar,
  setShowCreateModal,
}) => {
  return (
    <div
      className="fixed inset-0 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 bg-opacity-75 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-avatar-title"
    >
      <div className="bg-gray/20 p-6 rounded-lg w-96 max-w-full">
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
            className="w-full p-2 mt-1 rounded bg-black/35 from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
            autoFocus
            aria-required="true"
          />
        </label>
        <label className="block mb-4 text-sm text-gray-300">
          Description
          <textarea
            value={newAvatarDescription}
            onChange={(e) => setNewAvatarDescription(e.target.value)}
            className="w-full p-2 mt-1 rounded bg-black/35 from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
            rows={3}
            aria-multiline="true"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowCreateModal(false)}
            className="transition-transform duration-300 hover:scale-105 px-4 py-2 rounded hover:bg-cyan-600 transition-colors focus:outline focus:outline-2 focus:outline-cyan-400 min-w-0 rounded px-3 py-2 border border-gray-700 text-white bg-black/35 from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 transform shadow-lg"
          >
            Cancel
          </button>
          <button
            onClick={createAvatar}
            className="transition-transform duration-300 hover:scale-105 px-4 py-2 rounded hover:bg-cyan-600 transition-colors focus:outline focus:outline-2 focus:outline-cyan-400 min-w-0 rounded px-3 py-2 border border-gray-700 text-white bg-black/35 from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 transform shadow-lg"
            disabled={!newAvatarName.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAvatarModal;