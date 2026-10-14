"use client";

import { User, Users, FileCheck } from "lucide-react";
import { NavLateral } from "@/components/navigation/NavLateral";

const liens = [
  { href: "/conseiller/compte", label: "Mon compte", icon: User },
  { href: "/conseiller/factures", label: "Mes factures", icon: FileCheck },
  { href: "/conseiller/filleuls", label: "Mes filleuls", icon: Users },
];

export function AppSidebar() {
  return <NavLateral accueil="/conseiller" liens={liens} />;
}
