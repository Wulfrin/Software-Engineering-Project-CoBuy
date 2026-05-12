import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";
export default async function NotificationsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/auth/login");
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userEmail={data.claims.email as string} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}