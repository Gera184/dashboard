import { requireSession } from "@/lib/auth/session";
import { EntriesPage } from "../entries-page";

export default async function IncomePage() {
  await requireSession();
  return <EntriesPage type="income" />;
}
