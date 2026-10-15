"use client";

import type { LucideIcon } from "lucide-react";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/app/context/authContext";
import { cn } from "@/lib/utils";
import { initiales } from "@/utils/initiales";

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

/** Infobulle affichée seulement quand le menu est réduit aux icônes (desktop). */
function InfoBulle({
  libelle,
  children,
}: {
  libelle: string;
  children: React.ReactNode;
}) {
  const { state, isMobile } = useSidebar();
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" hidden={state !== "collapsed" || isMobile}>
        {libelle}
      </TooltipContent>
    </Tooltip>
  );
}

/** Une entrée est active sur sa page et sur toutes ses sous-pages. */
function estActif(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLateral({ accueil, liens }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { setOpenMobile, toggleSidebar, state, isMobile } = useSidebar();
  const replie = state === "collapsed" && !isMobile;

  const deconnecter = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) router.push("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  };

  return (
    <Sidebar
      side="left"
      collapsible="icon"
      className="border-r border-gray-100"
    >
      <SidebarHeader className="flex-row items-center justify-between gap-2 border-b border-gray-100 px-5 py-5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <Link
          href={accueil}
          onClick={() => setOpenMobile(false)}
          className="group-data-[collapsible=icon]:hidden"
        >
          <Image
            width={140}
            height={40}
            alt="Logo Youlive immobilier"
            src="/images/logo.svg"
          />
        </Link>
        <InfoBulle libelle="Développer le menu">
          <button
            onClick={toggleSidebar}
            aria-label={replie ? "Développer le menu" : "Réduire le menu"}
            className="hidden h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 outline-none transition-colors hover:bg-gray-50 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-[#E07C24]/60 md:flex"
          >
            {replie ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </InfoBulle>
      </SidebarHeader>

      <SidebarContent className="px-3 py-5">
        <SidebarGroup>
          <p className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 group-data-[collapsible=icon]:hidden">
            Menu
          </p>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {liens.map(({ href, label, icon: Icon }) => {
                const actif = estActif(pathname, href);
                return (
                  <SidebarMenuItem key={href}>
                    <InfoBulle libelle={label}>
                      <Link
                        href={href}
                        onClick={() => setOpenMobile(false)}
                        aria-current={actif ? "page" : undefined}
                        className={cn(
                          "group/lien relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                          "outline-none transition-colors duration-150",
                          "focus-visible:ring-2 focus-visible:ring-[#E07C24]/60",
                          "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
                          actif
                            ? "bg-[#fef3e8] text-[#b35a10]"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#E07C24]",
                            "transition-opacity duration-150",
                            actif ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            actif
                              ? "text-[#E07C24]"
                              : "text-gray-400 group-hover/lien:text-gray-600",
                          )}
                        />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {label}
                        </span>
                      </Link>
                    </InfoBulle>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-gray-100 px-3 py-4">
        {user && (
          <div className="flex items-center gap-3 px-3 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fef3e8] text-xs font-semibold text-[#b35a10]"
            >
              {initiales(user.name)}
            </span>
            <span className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
              <span className="block truncate text-sm font-medium text-gray-900">
                {user.name}
              </span>
              <span className="block truncate text-xs text-gray-400">
                {LIBELLE_ROLE[user.role] ?? user.role}
              </span>
            </span>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <InfoBulle libelle="Déconnexion">
              <button
                onClick={deconnecter}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 outline-none transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-300 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">
                  Déconnexion
                </span>
              </button>
            </InfoBulle>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
