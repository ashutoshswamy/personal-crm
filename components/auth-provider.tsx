"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

type AuthState = {
  user: User | null;
  loading: boolean;
  getToken: () => Promise<string>;
  signOut: () => Promise<void>;
  refreshUser: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const value: AuthState = {
    user,
    loading,
    getToken: async () => {
      if (!auth.currentUser) throw new Error("Not signed in");
      return auth.currentUser.getIdToken();
    },
    signOut: () => firebaseSignOut(auth),
    // Firebase mutates auth.currentUser in place on updateProfile(); clone it so React re-renders.
    refreshUser: () => setUser(auth.currentUser ? ({ ...auth.currentUser } as User) : null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
