import { AuthProvider } from "../context/authContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BarreSuperieure } from "@/components/navigation/BarreSuperieure";
import { AppSidebar } from "./sidebarConseiller";
import "../globals.css";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { devUser } from "@/lib/devAuth";
import Link from "next/link";
import Image from "next/image";

export const runtime = 'nodejs';

export default async function ConseillerLayout({
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
          <BarreSuperieure accueil="/conseiller" />
          <div className="flex-grow">
            {children}
          </div>
          <footer className="w-full py-4 px-6 mt-auto">
            <div className="flex flex-row space-x-4 items-center justify-center max-w-7xl mx-auto">
              <span className="text-md text-gray-500 font-bold">
                Application développée par
              </span>
              <Link href="https://websmith.fr">
                <Image
                  src="/images/logoWebsmith.svg"
                  alt="logo"
                  width={150}
                  height={100}
                />
              </Link>
            </div>
          </footer>
        </main>
      </SidebarProvider>
    </AuthProvider>
  );
}