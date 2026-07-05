"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginInner() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const params = useSearchParams();
  const linkError = params.get("error");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    setSent(true);
  }

  return (
    <div className="wl-page" data-scheme="dark">
      <main className="wl-main">
        <div className="wl-eyebrow">
          <span className="wl-dot" aria-hidden />
          <span>waitloop</span>
        </div>
        <h1 className="wl-headline">Log in</h1>
        {sent ? (
          <p className="wl-description">
            Magic link sent to <strong>{email}</strong>. Check your inbox — or the server logs if
            you&apos;re running without an email provider.
          </p>
        ) : (
          <>
            <p className="wl-description">
              Enter your email and we&apos;ll send you a login link. No password, no account setup.
            </p>
            {linkError ? (
              <p className="wl-error">That login link is invalid or expired. Request a new one.</p>
            ) : null}
            <form onSubmit={submit} style={{ width: "100%" }}>
              <div className="wl-form">
                <input
                  className="wl-input"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email address"
                />
                <button className="wl-button" type="submit" disabled={busy}>
                  {busy ? "Sending…" : "Send login link"}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
      <footer className="wl-footer">
        <a href="/">← waitloop</a>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
