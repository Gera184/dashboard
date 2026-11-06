import { requireSession } from "@/lib/auth/session";
import { EmployeesView } from "./view";

export default async function EmployeesPage() {
  await requireSession();
  return <EmployeesView />;
}
