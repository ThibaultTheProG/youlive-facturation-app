"use client";

import { User, Users, FileCheck, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/conseiller/compte", label: "Mon compte", icon: User },
  { href: "/conseiller/factures", label: "Mes factures", icon: FileCheck },
  { href: "/conseiller/filleuls", label: "Mes filleuls", icon: Users },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) router.push("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  };

  return (
    <Sidebar side="left">
      {/* Logo */}
      <SidebarHeader className="px-5 py-5 border-b border-gray-100">
        <Link href="/conseiller">
          <Image
            width={140}
            height={40}
            alt="Logo Youlive immobilier"
            src="/images/logo.svg"
          />
        </Link>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
            Menu
          </p>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <SidebarMenuItem key={href}>
                    <Link
                      href={href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                      style={
                        isActive
                          ? { backgroundColor: "#E07C24", color: "white" }
                          : { color: "#4B5563" }
                      }
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "#f9fafb";
                          (e.currentTarget as HTMLElement).style.color = "#111827";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "";
                          (e.currentTarget as HTMLElement).style.color = "#4B5563";
                        }
                      }}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="px-3 py-4 border-t border-gray-100">
        <SidebarMenu>
          <SidebarMenuItem>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all w-full cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Déconnexion</span>
            </button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
