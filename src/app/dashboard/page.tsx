import { requireSession } from "@/lib/auth/session";
import { DashboardView } from "./view";

export default async function DashboardPage() {
  await requireSession();
  return <DashboardView />;
}
