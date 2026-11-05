"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, Briefcase, Calendar, ChartNoAxesColumn, ChevronDown, CircleMinus, CirclePlus, FileText,
  Files, Headset, House, LogOut, Menu, Settings, UserRound, Users, UsersRound, X,
} from "lucide-react";
import { NAV } from "./nav";
import { notifications, PERIOD } from "@/lib/data";
import { logout } from "@/app/login/actions";

const ICONS = {
  house: House, income: CirclePlus, expenses: CircleMinus, reports: FileText, employees: Users,
  clients: UsersRound, projects: Briefcase, documents: Files, settings: Settings,
} as const;

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return { open, setOpen, ref };
}

export function Shell({ displayName, children }: { displayName: string; children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setNavOpen(false), [pathname]);
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNavOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navOpen]);

  const current = NAV.find((n) => (n.slug ? pathname === `/dashboard/${n.slug}` : pathname === "/dashboard"));

  return (
    <div className="shell" data-open={navOpen}>
      <aside className="sidebar" id="sidebar" aria-label="ניווט ראשי">
        <button className="icon-btn sidebar-close" onClick={() => setNavOpen(false)} aria-label="סגירת תפריט">
          <X size={20} />
        </button>
        <div className="brand">
          <span className="brand-mark"><ChartNoAxesColumn size={22} aria-hidden /></span>
          העסק שלי
        </div>
        <nav className="nav">
          {NAV.map((item) => {
            const Icon = ICONS[item.icon];
            const href = item.slug ? `/dashboard/${item.slug}` : "/dashboard";
            return (
              <Link key={item.slug} href={href} aria-current={current === item ? "page" : undefined}>
                <Icon size={20} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="help-card">
          <Headset size={26} aria-hidden />
          <div>
            <strong>צריך עזרה?</strong>
            <span>צור קשר עם התמיכה</span>
          </div>
        </div>
      </aside>
      <div className="backdrop" onClick={() => setNavOpen(false)} aria-hidden />

      <div className="main">
        <header className="topbar">
          <div className="title-block">
            <button className="icon-btn menu-btn" onClick={() => setNavOpen(true)} aria-label="פתיחת תפריט" aria-controls="sidebar" aria-expanded={navOpen}>
              <Menu size={22} />
            </button>
            <div>
              <h1>{current && current.slug ? current.label : "דשבורד פיננסי"}</h1>
              <p>סיכום הפעילות של העסק</p>
            </div>
          </div>
          <div className="top-actions">
            <DatePicker />
            <Notifications />
            <UserMenu displayName={displayName} />
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

const MONTHS = [
  { label: PERIOD.label, available: true },
  { label: "1 – 30 בספטמבר 2026", available: false },
  { label: "1 – 31 באוגוסט 2026", available: false },
];

function DatePicker() {
  const { open, setOpen, ref } = usePopover();
  return (
    <div className="anchor" ref={ref}>
      <button className="date-btn" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} aria-label={`תקופה: ${PERIOD.label}`}>
        <Calendar size={18} aria-hidden />
        <span className="sep date-text" aria-hidden />
        <span className="date-text">{PERIOD.label}</span>
        <ChevronDown size={16} aria-hidden />
      </button>
      {open && (
        <div className="popover" role="menu">
          <div className="popover-title">בחירת תקופה</div>
          {MONTHS.map((m) => (
            <button key={m.label} className="opt" role="menuitemradio" aria-checked={m.available} disabled={!m.available} onClick={() => setOpen(false)}>
              <span>{m.label}</span>
              {!m.available && <small>אין נתוני דוגמה</small>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const { open, setOpen, ref } = usePopover();
  return (
    <div className="anchor" ref={ref}>
      <button className="icon-btn" onClick={() => setOpen(!open)} aria-label={`התראות (${notifications.length} חדשות)`} aria-expanded={open}>
        <Bell size={21} />
        <span className="dot" aria-hidden />
      </button>
      {open && (
        <div className="popover" role="dialog" aria-label="התראות">
          <div className="popover-title">התראות</div>
          <ul>
            {notifications.map((n) => (
              <li key={n.title}>
                <strong>{n.title}</strong>
                <small>{n.detail} · {n.time}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function UserMenu({ displayName }: { displayName: string }) {
  const { open, setOpen, ref } = usePopover();
  return (
    <div className="anchor" ref={ref}>
      <button className="user" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} aria-label={`חשבון: ${displayName}`}>
        <span className="avatar"><UserRound size={22} aria-hidden /></span>
        <span className="user-text">
          <strong>{displayName}</strong>
          <small>מנהל המערכת</small>
        </span>
      </button>
      {open && (
        <div className="popover" role="menu">
          <form action={logout}>
            <button className="opt" type="submit" role="menuitem">
              <span>התנתקות</span>
              <LogOut size={16} aria-hidden />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
