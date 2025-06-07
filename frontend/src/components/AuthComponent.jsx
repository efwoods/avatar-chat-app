import React, { useState } from "react";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const AuthComponent = () => {
  const [showModal, setShowModal] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const { user, isLoggedIn, accessToken, login, signup, logout } = useAuth();

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isSignup) {
        await signup(username, email, password);
      } else {
        await login(email, password);
      }
      setUsername("");
      setEmail("");
      setPassword("");
      setShowModal(false);
    } catch (error) {
      alert(`Auth Error: ${error.message}`);
      console.error("Authentication error:", error);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {isLoggedIn ? (
        <>
          <span className="text-white font-medium">{user?.username}</span>
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => {
              setIsSignup(true);
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-full text-white transition"
          >
            <UserPlus size={16} />
            <span>Signup</span>
          </button>
          <button
            onClick={() => {
              setIsSignup(false);
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition"
          >
            <LogIn size={16} />
            <span>Login</span>
          </button>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-purple-800 to-indigo-900 p-6 rounded-xl shadow-lg w-96">
            <h2 className="text-2xl font-bold text-white mb-4">{isSignup ? "Signup" : "Login"}</h2>
            <form onSubmit={handleAuth}>
              {isSignup && (
                <div className="mb-4">
                  <label className="block text-white mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}
              <div className="mb-4">
                <label className="block text-white mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-white mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white"
                >
                  {isSignup ? "Signup" : "Login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthComponent;
