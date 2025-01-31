"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthContextType } from "@/lib/types";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
}) => {
  const isAuthDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

  const testUser: User | null = isAuthDisabled
    ? {
        id: Number(process.env.NEXT_PUBLIC_TEST_USER_ID || 999),
        name: process.env.NEXT_PUBLIC_TEST_USER_NAME || "Utilisateur Test",
        email: process.env.NEXT_PUBLIC_TEST_USER_EMAIL || "test@example.com",
        role:
          (process.env.NEXT_PUBLIC_TEST_USER_ROLE as "admin" | "conseiller") ||
          "conseiller",
      }
    : null;

  const [user, setUser] = useState<User | null>(initialUser || testUser);
  const [loading, setLoading] = useState<boolean>(!initialUser && !testUser);

  useEffect(() => {
    if (!initialUser) {
      // Ajoutez une logique pour récupérer l'utilisateur si nécessaire
      console.log("Aucun utilisateur initial défini");
    }
  }, [initialUser]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Échec de la connexion");
      }

      const userResponse = await fetch("/api/auth/me", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!userResponse.ok) {
        throw new Error("Impossible de récupérer les données utilisateur.");
      }

      const userData: User = await userResponse.json();
      setUser(userData);
    } catch (error) {
      console.error("Erreur lors de la connexion :", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
};
