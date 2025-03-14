"use client";

import { Settings, FileCheck, LogOut, KeyRound } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login"); // Redirige l'utilisateur vers la page de connexion
      } else {
        console.error("Échec de la déconnexion");
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  };

  return (
    <Sidebar side="left">
      <SidebarHeader />
      <SidebarContent className="justify-bewteen">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href={"/admin"}>
                  <Image
                    width={200}
                    height={400}
                    alt="Logo Youlive immobiler"
                    src={"/images/logo.svg"}
                    className="pl-4"
                  />
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    href="/admin/parametres"
                    className={`${
                      pathname === "/admin/parametres"
                        ? "text-orangeStrong"
                        : ""
                    }`}
                  >
                    <span className="text-md font-bold">Paramètres des conseillers</span>
                    <Settings />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    href="/admin/inscription"
                    className={`${
                      pathname === "/admin/inscription"
                        ? "text-orangeStrong"
                        : ""
                    }`}
                  >
                    <span className="text-md font-bold">Assigner un mot de passe</span>
                    <KeyRound />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    href="/admin/suiviFactures"
                    className={`${
                      pathname === "/admin/suiviFactures"
                        ? "text-orangeStrong"
                        : ""
                    }`}
                  >
                    <span className="text-md font-bold">Suivi des factures</span>
                    <FileCheck />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut />
              <span className="cursor-pointer">Deconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
