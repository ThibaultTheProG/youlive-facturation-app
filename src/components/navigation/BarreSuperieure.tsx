"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

/**
 * Écrans étroits : barre avec un vrai bouton pour ouvrir le menu latéral.
 * Écrans larges : le bouton de repli habituel du menu.
 */
export function BarreSuperieure({ accueil }: { accueil: string }) {
  const { toggleSidebar } = useSidebar();
  return (
    <>
      <SidebarTrigger className="hidden md:inline-flex" />
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white/90 px-3 py-2 backdrop-blur md:hidden">
        <button
          onClick={toggleSidebar}
          aria-label="Ouvrir le menu"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 outline-none transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-[#E07C24]/60"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href={accueil}>
          <Image
            width={110}
            height={32}
            alt="Logo Youlive immobilier"
            src="/images/logo.svg"
          />
        </Link>
      </header>
    </>
  );
}
