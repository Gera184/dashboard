import { requireSession } from "@/lib/auth/session";
import { readStore } from "@/lib/store";
import { availableMonths, periodLabel } from "@/lib/data";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const months = availableMonths(await readStore()).map((key) => ({ key, label: periodLabel(key) }));
  return <Shell displayName={session.displayName} months={months}>{children}</Shell>;
}
