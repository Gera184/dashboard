import { requireSession } from "@/lib/auth/session";
import { SalariesView } from "./view";

export default async function SalariesPage() {
  await requireSession();
  return <SalariesView />;
}
