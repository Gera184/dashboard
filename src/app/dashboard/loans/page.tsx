import { requireSession } from "@/lib/auth/session";
import { LoansView } from "./view";

export default async function LoansPage() {
  await requireSession();
  return <LoansView />;
}
