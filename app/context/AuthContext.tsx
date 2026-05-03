// app/context/AuthContext.tsx
"use client";

import { createContext, useContext, useState } from "react";
import { User } from "firebase/auth";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// --- DEV BYPASS ---
// Fake user data so you can test the Dashboard and Navbar
const MOCK_USER = {
  uid: "hackathon-demo-user-123",
  email: "student@university.edu",
  displayName: "Demo Student"
} as User;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Instantly set the user to our fake MOCK_USER
  const [user, setUser] = useState<User | null>(MOCK_USER);
  const loading = false; // Never loading, instantly ready

  // Fake login/logout functions so the UI buttons don't crash
  const loginWithGoogle = async () => {
    setUser(MOCK_USER);
  };

  const logout = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);