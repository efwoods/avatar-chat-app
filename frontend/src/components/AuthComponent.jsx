import React, { useState, useEffect } from "react";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import { useNgrokApiUrl } from "../context/NgrokAPIContext";

const AuthComponent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const {ngrokHttpsUrl, ngrokWsUrl} = useNgrokApiUrl();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    const signupData = { username, email, password };

    try {
      // Step 1: Sign up and receive access token
      const signupResponse = await fetch(`${ngrokHttpsUrl}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      });

      if (!signupResponse.ok) {
        const err = await signupResponse.json();
        throw new Error(`Signup failed: ${err.detail || signupResponse.status}`);
      }

      const { access_token } = await signupResponse.json();
      console.log("access_token:", access_token);


      // Step 2: Fetch profile data using the access token
      const profileResponse = await fetch(`${ngrokHttpsUrl}/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
        },
      });

      if (!profileResponse.ok) {
        throw new Error("Failed to fetch profile");
      }

      // const userData = await profileResponse.json();

      // Step 3: Set user state and persist to localStorage
      // const fullUser = { ...userData, token: access_token };
      // setUser(fullUser);
      // setIsLoggedIn(true);
      // localStorage.setItem("user", JSON.stringify(fullUser));

      // Step 4: Clear form and close modal
      setUsername("");
      setEmail("");
      setPassword("");
      setShowModal(false);

    } catch (err) {
      console.error("Signup or profile fetch error:", err.message);
      setError(err.message);
    }
  }


  const handleLogin = (e) => {
    e.preventDefault();
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser && storedUser.email === email && storedUser.password === password) {
      setUser(storedUser);
      setIsLoggedIn(true);
    } else {
      alert("Invalid credentials");
    }
    setShowModal(false);
    setEmail("");
    setPassword("");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <div className="flex items-center space-x-4">
      {isLoggedIn ? (
        <>
          <span className="text-white font-medium">{user?.username}</span>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => { setShowModal(true); setIsSignup(true); }}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-full text-white transition"
          >
            <UserPlus size={16} />
            <span>Signup</span>
          </button>
          <button
            onClick={() => { setShowModal(true); setIsSignup(false); }}
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
            <form onSubmit={isSignup ? handleSignup : handleLogin}>
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