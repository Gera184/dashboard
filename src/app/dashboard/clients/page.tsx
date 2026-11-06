import { requireSession } from "@/lib/auth/session";
import { ClientsView } from "./view";

export default async function ClientsPage() {
  await requireSession();
  return <ClientsView />;
}
