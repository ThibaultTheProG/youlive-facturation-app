"use client";

import React, { createContext, useContext, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "conseiller";
}

interface AuthContextType {
  user: User | null; // Typage approprié pour l'utilisateur
  loading: boolean; // Indique si l'authentification est en cours
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null); // Assurez que le type `User | null` est utilisé
  const [loading, setLoading] = useState<boolean>(false); // Indicateur de chargement

  const login = async (email: string, password: string) => {
    setLoading(true); // Démarre le chargement
    try {
      // Envoyer la requête de connexion
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Échec de la connexion");
      }

      // Appeler l'API `/me` pour récupérer les informations utilisateur
      const userResponse = await fetch("/api/auth/me", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Inclure les cookies pour le côté serveur
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
      setLoading(false); // Arrête le chargement
    }
  };

  const logout = () => {
    setUser(null);
    fetch("/api/auth/logout", { method: "POST", credentials: "include" }); // Assurez-vous que le cookie est supprimé côté serveur
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