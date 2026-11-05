import type { Metadata } from "next";
import { ChartNoAxesColumn, ShieldCheck } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "כניסה | העסק שלי" };

export default function LoginPage() {
  return (
    <main className="login-page">
      <aside className="login-side" aria-hidden>
        <div className="brand">
          <span className="brand-mark"><ChartNoAxesColumn size={19} strokeWidth={2.2} /></span>
          העסק שלי
        </div>
        <div>
          <p className="login-quote">כל שקל של העסק, במקום אחד.</p>
          <p>הכנסות, הוצאות, משכורות, הלוואות ועמלות הנציגים, מסוכמים לפי חודש.</p>
        </div>
      </aside>
      <div className="login-main">
        <div className="login-card">
          <div className="login-brand">
            <span className="brand-mark" style={{ color: "#fff" }}><ChartNoAxesColumn size={19} strokeWidth={2.2} aria-hidden /></span>
            <span>העסק שלי</span>
          </div>
          <h1>כניסה למערכת</h1>
          <p className="muted" style={{ margin: 0 }}>הגישה מוגבלת למנהל המערכת בלבד.</p>
          <LoginForm />
          <div className="login-note"><ShieldCheck size={15} aria-hidden /> הגישה מוגנת בסיסמה, והחיבור נשמר בעוגייה מאובטחת</div>
        </div>
      </div>
    </main>
  );
}
