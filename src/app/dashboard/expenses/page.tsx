import { requireSession } from "@/lib/auth/session";
import { EntriesPage } from "../entries-page";

export default async function ExpensesPage() {
  await requireSession();
  return <EntriesPage type="expense" />;
}
