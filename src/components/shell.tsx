"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Banknote, Bell, Calendar, ChartNoAxesColumn, ChevronDown, CircleMinus, CirclePlus, House, Landmark,
  LogOut, Menu, ShieldCheck, Users, UsersRound, X,
} from "lucide-react";
import { NAV } from "./nav";
import { logout } from "@/app/login/actions";
import { isMonthKey, periodLabel } from "@/lib/data";

const ICONS = {
  house: House, income: CirclePlus, expenses: CircleMinus, salaries: Banknote, loans: Landmark,
  employees: Users, clients: UsersRound,
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

type Month = { key: string; label: string };

export function Shell({ displayName, months, children }: { displayName: string; months: Month[]; children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get("month");
  // Pages accept any valid ?month=, so the header must show that month too (even one with no data).
  const month = months.find((m) => m.key === requested) ?? (isMonthKey(requested) ? { key: requested, label: periodLabel(requested) } : months[0]);
  const q = month.key === months[0].key && !requested ? "" : `?month=${month.key}`;
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
          <span className="brand-mark"><ChartNoAxesColumn size={19} strokeWidth={2.2} aria-hidden /></span>
          העסק שלי
        </div>
        <div className="nav-label" aria-hidden>ניהול העסק</div>
        <nav className="nav">
          {NAV.map((item) => {
            const Icon = ICONS[item.icon];
            const href = (item.slug ? `/dashboard/${item.slug}` : "/dashboard") + q;
            return (
              <Link key={item.slug} href={href} aria-current={current === item ? "page" : undefined}>
                <Icon size={19} strokeWidth={1.8} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-foot"><ShieldCheck size={15} aria-hidden /> גישה בסיסמה בלבד</div>
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
            <DatePicker months={months} selected={month} pathname={pathname} />
            <Notifications />
            <UserMenu displayName={displayName} />
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

function DatePicker({ months, selected, pathname }: { months: Month[]; selected: Month; pathname: string }) {
  const { open, setOpen, ref } = usePopover();
  return (
    <div className="anchor" ref={ref}>
      <button className="date-btn" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} aria-label={`תקופה: ${selected.label}`}>
        <Calendar size={17} aria-hidden />
        <span className="sep date-text" aria-hidden />
        <span className="date-text">{selected.label}</span>
        <ChevronDown size={16} aria-hidden />
      </button>
      {open && (
        <div className="popover" role="menu">
          <div className="popover-title">בחירת חודש</div>
          <div className="popover-scroll">
            {months.map((m) => (
              <Link key={m.key} href={`${pathname}?month=${m.key}`} className="opt" role="menuitemradio" aria-checked={m.key === selected.key} onClick={() => setOpen(false)}>
                <span>{m.label}</span>
              </Link>
            ))}
          </div>
          <small className="popover-hint">מוצגים החודש הנוכחי וחודשים שיש בהם נתונים</small>
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const { open, setOpen, ref } = usePopover();
  return (
    <div className="anchor" ref={ref}>
      <button className="icon-btn" onClick={() => setOpen(!open)} aria-label="התראות" aria-expanded={open}>
        <Bell size={19} strokeWidth={1.8} />
      </button>
      {open && (
        <div className="popover" role="dialog" aria-label="התראות">
          <div className="popover-title">התראות</div>
          <p className="muted" style={{ margin: 0, padding: "4px 10px 8px" }}>אין התראות חדשות.</p>
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
        <span className="avatar" aria-hidden>{displayName.trim().charAt(0) || "מ"}</span>
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
