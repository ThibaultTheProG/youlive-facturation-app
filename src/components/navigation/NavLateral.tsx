"use client";

import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/app/context/authContext";
import { cn } from "@/lib/utils";

export type LienNav = { href: string; label: string; icon: LucideIcon };

type Props = {
  /** Page d'accueil de l'espace : cible du logo, et entrée jamais « active » par préfixe. */
  accueil: string;
  liens: LienNav[];
};

const LIBELLE_ROLE: Record<string, string> = {
  admin: "Administrateur",
  conseiller: "Conseiller",
};

function initiales(nom: string | undefined): string {
  const mots = (nom ?? "").trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return "?";
  return (mots[0][0] + (mots.length > 1 ? mots[mots.length - 1][0] : "")).toUpperCase();
}

/** Une entrée est active sur sa page et sur toutes ses sous-pages. */
function estActif(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLateral({ accueil, liens }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { setOpenMobile } = useSidebar();

  const deconnecter = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) router.push("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  };

  return (
    <Sidebar side="left" className="border-r border-gray-100">
      <SidebarHeader className="px-5 py-5 border-b border-gray-100">
        <Link href={accueil} onClick={() => setOpenMobile(false)}>
          <Image width={140} height={40} alt="Logo Youlive immobilier" src="/images/logo.svg" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-5">
        <SidebarGroup>
          <p className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Menu
          </p>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {liens.map(({ href, label, icon: Icon }) => {
                const actif = estActif(pathname, href);
                return (
                  <SidebarMenuItem key={href}>
                    <Link
                      href={href}
                      onClick={() => setOpenMobile(false)}
                      aria-current={actif ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                        "outline-none transition-colors duration-150",
                        "focus-visible:ring-2 focus-visible:ring-[#E07C24]/60",
                        actif
                          ? "bg-[#fef3e8] text-[#b35a10]"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#E07C24]",
                          "transition-opacity duration-150",
                          actif ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          actif ? "text-[#E07C24]" : "text-gray-400 group-hover:text-gray-600"
                        )}
                      />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-gray-100 px-3 py-4">
        {user && (
          <div className="flex items-center gap-3 px-3 py-1">
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fef3e8] text-xs font-semibold text-[#b35a10]"
            >
              {initiales(user.name)}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-medium text-gray-900">{user.name}</span>
              <span className="block truncate text-xs text-gray-400">
                {LIBELLE_ROLE[user.role] ?? user.role}
              </span>
            </span>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <button
              onClick={deconnecter}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 outline-none transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-300"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Déconnexion</span>
            </button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
