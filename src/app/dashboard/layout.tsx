import { requireSession } from "@/lib/auth/session";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return <Shell displayName={session.displayName}>{children}</Shell>;
}
