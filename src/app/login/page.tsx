import type { Metadata } from "next";
import { ChartNoAxesColumn } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "כניסה | העסק שלי" };

export default function LoginPage() {
  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-mark">
            <ChartNoAxesColumn size={22} aria-hidden />
          </span>
          <span>העסק שלי</span>
        </div>
        <h1>כניסה למערכת</h1>
        <p className="muted">הגישה מוגבלת למנהל המערכת בלבד.</p>
        <LoginForm />
      </div>
    </main>
  );
}
