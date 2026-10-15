import { SidebarProvider } from "@/components/ui/sidebar";
import { BarreSuperieure } from "@/components/navigation/BarreSuperieure";
import { PiedDePage } from "@/components/PiedDePage";
import { AppSidebar } from "./sidebarAdmin";
import "../globals.css";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { devUser } from "@/lib/devAuth";
import { AuthProvider } from "../context/authContext";

export const runtime = 'nodejs';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const menuReplie = cookieStore.get("sidebar:state")?.value === "false";
  let user = devUser();

  if (!user) {
    const token = cookieStore.get("authToken")?.value;

    if (token) {
      user = await verifyToken(token);
    }
  }

  return (
    <AuthProvider initialUser={user}>
      <SidebarProvider defaultOpen={!menuReplie}>
        <AppSidebar />
        <main className="flex flex-col min-h-screen w-full">
          <BarreSuperieure accueil="/admin" />
          <div className="flex-grow">
            {children}
          </div>
          <PiedDePage />
        </main>
      </SidebarProvider>
    </AuthProvider>
  );
}
