import { AuthProvider } from "../context/authContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./sidebarConseiller";
import "../globals.css";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";

export const runtime = 'nodejs';

export default async function ConseillerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

  let user = null;

  if (isAuthDisabled) {
    user = {
      id: Number(process.env.NEXT_PUBLIC_TEST_USER_ID || 999),
      name: process.env.NEXT_PUBLIC_TEST_USER_NAME || "Utilisateur Test",
      email: process.env.NEXT_PUBLIC_TEST_USER_EMAIL || "test@example.com",
      role: (process.env.NEXT_PUBLIC_TEST_USER_ROLE as "admin" | "conseiller") || "conseiller",
    };
  } else {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (token) {
      user = await verifyToken(token);
    }
  }


  return (
    <AuthProvider initialUser={user}>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex flex-col min-h-screen w-full">
          <SidebarTrigger />
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