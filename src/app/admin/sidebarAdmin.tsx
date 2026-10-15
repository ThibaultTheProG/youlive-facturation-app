"use client";

import { Settings, FileCheck, KeyRound, RefreshCw, BookOpen } from "lucide-react";
import { NavLateral } from "@/components/navigation/NavLateral";

const liens = [
  { href: "/admin/parametres", label: "Paramètres conseillers", icon: Settings },
  { href: "/admin/inscription", label: "Assigner un mot de passe", icon: KeyRound },
  { href: "/admin/suiviFactures", label: "Suivi des factures", icon: FileCheck },
  { href: "/admin/synchronisations", label: "Synchronisations", icon: RefreshCw },
  { href: "/admin/documentation", label: "Documentation", icon: BookOpen },
];

export function AppSidebar() {
  return <NavLateral accueil="/admin" liens={liens} />;
}
