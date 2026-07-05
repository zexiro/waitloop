"use client";

import { useEffect, useState } from "react";

type Ticket = { position: number; referralUrl: string };

export function SignupForm({
  slug,
  buttonText,
  successMessage,
  referralsEnabled,
}: {
  slug: string;
  buttonText: string;
  successMessage: string;
  referralsEnabled: boolean;
}) {
  const storageKey = `waitloop:${slug}`;
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setTicket(JSON.parse(saved));
    } catch {
      /* ignore corrupt storage */
    }
  }, [storageKey]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const ref = new URLSearchParams(window.location.search).get("ref") ?? undefined;
      const res = await fetch(`/api/public/w/${slug}/signups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ref }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "something went wrong");
      const t = { position: data.position, referralUrl: data.referralUrl };
      setTicket(t);
      localStorage.setItem(storageKey, JSON.stringify(t));
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!ticket) return;
    await navigator.clipboard.writeText(ticket.referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (ticket) {
    return (
      <div className="wl-ticket" role="status">
        <div>
          <div className="wl-ticket-label">{successMessage} Your place in line</div>
          <div className="wl-position">
            <span className="wl-hash">#</span>
            {String(ticket.position).padStart(3, "0")}
          </div>
        </div>
        {referralsEnabled ? (
          <div className="wl-referral">
            <div className="wl-ticket-label">Skip ahead — each friend who joins moves you up</div>
            <div className="wl-referral-row">
              <span className="wl-referral-url">{ticket.referralUrl}</span>
              <button type="button" className="wl-copy" onClick={copy}>
                {copied ? "copied" : "copy"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form className="wl-form-wrap" onSubmit={submit} style={{ width: "100%" }}>
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
          {busy ? "Joining…" : buttonText}
        </button>
      </div>
      {error ? <p className="wl-error">{error}</p> : null}
    </form>
  );
}
