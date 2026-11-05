import { notFound } from "next/navigation";
import { Construction } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { NAV } from "@/components/nav";

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  await requireSession();
  const { section } = await params;
  const item = NAV.find((n) => n.slug && n.slug === section);
  if (!item) notFound();
  return (
    <section className="card placeholder">
      <Construction size={36} className="muted" aria-hidden />
      <h2>{item.label}</h2>
      <p className="muted">העמוד בבנייה. הנתונים המלאים מוצגים כרגע בדשבורד הראשי.</p>
    </section>
  );
}
