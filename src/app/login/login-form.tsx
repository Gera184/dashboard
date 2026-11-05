"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);
  return (
    <form action={action} className="login-form" noValidate>
      <label className="field">
        <span>שם משתמש</span>
        <input name="username" type="text" autoComplete="username" required dir="ltr" defaultValue={state?.username} key={state?.username ?? ""} />
      </label>
      <label className="field">
        <span>סיסמה</span>
        <input name="password" type="password" autoComplete="current-password" required dir="ltr" />
      </label>
      {state?.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <button className="btn-primary" type="submit" disabled={pending}>
        <Lock size={16} aria-hidden />
        {pending ? "מתחבר…" : "כניסה"}
      </button>
    </form>
  );
}
