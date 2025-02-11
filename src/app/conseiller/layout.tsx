import { AuthProvider } from "../context/authContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./sidebarConseiller";
import "../globals.css";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

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

  console.log("Utilisateur dans ConseillerLayout :", user);

  return (
    <AuthProvider initialUser={user}>
      <SidebarProvider>
        <AppSidebar />
        <main>
          <SidebarTrigger />
          {children}
        </main>
      </SidebarProvider>
    </AuthProvider>
  );
}