import Link from "next/link";

export function Empty({ text, href, cta }: { text: string; href?: string; cta?: string }) {
  return (
    <div className="empty">
      <p>{text}</p>
      {href && cta && <Link className="link-btn" href={href}>{cta}</Link>}
    </div>
  );
}
