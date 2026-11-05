import { requireSession } from "@/lib/auth/session";
import { resolveMonth } from "@/lib/data";
import { EntriesPage } from "../entries-page";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ month?: string | string[] }> }) {
  await requireSession();
  return <EntriesPage type="expense" month={resolveMonth((await searchParams).month)} />;
}
