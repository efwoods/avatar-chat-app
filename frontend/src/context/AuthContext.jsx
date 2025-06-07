import React, { createContext, useContext, useState, useEffect } from "react";
import { useNgrokApiUrl } from "./NgrokAPIContext";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { ngrokHttpsUrl } = useNgrokApiUrl();
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("access_token");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedToken);
      setIsLoggedIn(true);
    }
  }, []);

  const signup = async (username, email, password) => {
    const signupData = { username, email, password };

    const signupResponse = await fetch(`${ngrokHttpsUrl}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signupData),
    });

    if (!signupResponse.ok) {
      const err = await signupResponse.json();
      throw new Error(err.detail || "Signup failed");
    }

    const { access_token } = await signupResponse.json();
    const profileResponse = await fetch(`${ngrokHttpsUrl}/profile`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: "application/json",
        "ngrok-skip-browser-warning": "69420",
      },
    });

    if (!profileResponse.ok) {
      const errText = await profileResponse.text();
      throw new Error(errText || "Failed to fetch profile");
    }

    const profileData = await profileResponse.json();
    setUser(profileData);
    setAccessToken(access_token);
    setIsLoggedIn(true);
    localStorage.setItem("user", JSON.stringify(profileData));
    localStorage.setItem("access_token", access_token);
  };

  const login = async (email, password) => {
    const loginParams = new URLSearchParams();
    loginParams.append("username", email);
    loginParams.append("password", password);
    loginParams.append("grant_type", "");
    loginParams.append("scope", "");
    loginParams.append("client_id", "");
    loginParams.append("client_secret", "");

    const loginResponse = await fetch(`${ngrokHttpsUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "ngrok-skip-browser-warning": "69420",
      },
      body: loginParams.toString(),
    });

    if (!loginResponse.ok) {
      const err = await loginResponse.json();
      throw new Error(err.detail || "Login failed");
    }

    const { access_token } = await loginResponse.json();
    const profileResponse = await fetch(`${ngrokHttpsUrl}/profile`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: "application/json",
        "ngrok-skip-browser-warning": "69420",
      },
    });

    if (!profileResponse.ok) {
      const errText = await profileResponse.text();
      throw new Error(errText || "Failed to fetch profile");
    }

    const profileData = await profileResponse.json();
    setUser(profileData);
    setAccessToken(access_token);
    setIsLoggedIn(true);
    localStorage.setItem("user", JSON.stringify(profileData));
    localStorage.setItem("access_token", access_token);
  };

  const logout = async () => {
    const token = localStorage.getItem("access_token");
    await fetch(`${ngrokHttpsUrl}/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "ngrok-skip-browser-warning": "69420",
      },
    });
    setUser(null);
    setAccessToken(null);
    setIsLoggedIn(false);
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, accessToken, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
