"use client";

import { useEffect, useState } from "react";
import {
  AVATAR_ACCESSORIES,
  AVATAR_COLORS,
  AVATAR_EXPRESSIONS,
  type Avatar,
  type EarnedItem,
} from "@/lib/avatars";
import { QueueAvatar } from "@/components/queue-avatar";

type Ticket = {
  position: number;
  referralUrl: string;
  code?: string;
  avatar?: Avatar;
  earned?: EarnedItem[];
};

const MILESTONES: { item: EarnedItem; name: string; friends: number }[] = [
  { item: "balloon", name: "Balloon", friends: 1 },
  { item: "pennant", name: "Pennant", friends: 5 },
  { item: "glow", name: "Golden Glow", friends: 10 },
];

const CHIP_FACE: Avatar = { expression: "smile", accessory: "none", color: "#ffd166" };

const EXPRESSION_LABELS: Record<Avatar["expression"], string> = {
  smile: "Smile",
  grin: "Grin",
  wink: "Wink",
  joy: "Joy",
  starry: "Starry",
};

const ACCESSORY_LABELS: Record<Avatar["accessory"], string> = {
  none: "Nothing",
  party: "Party hat",
  cap: "Cap",
  bow: "Bow",
  glasses: "Glasses",
};

export function SignupForm({
  slug,
  buttonText,
  successMessage,
  referralsEnabled,
  avatarsEnabled,
}: {
  slug: string;
  buttonText: string;
  successMessage: string;
  referralsEnabled: boolean;
  avatarsEnabled: boolean;
}) {
  const storageKey = `waitloop:${slug}`;
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [copied, setCopied] = useState(false);
  const [justJoined, setJustJoined] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setTicket(JSON.parse(saved));
    } catch {
      /* ignore corrupt storage */
    }
  }, [storageKey]);

  function saveTicket(t: Ticket) {
    setTicket(t);
    try {
      localStorage.setItem(storageKey, JSON.stringify(t));
    } catch {
      /* storage full or blocked — the ticket still renders */
    }
  }

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
      saveTicket({
        position: data.position,
        referralUrl: data.referralUrl,
        code: data.referralCode,
        avatar: data.avatar,
        earned: data.earned,
      });
      setJustJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function updateAvatar(patch: Partial<Avatar>) {
    if (!ticket?.code || !ticket.avatar) return;
    const next = { ...ticket.avatar, ...patch };
    saveTicket({ ...ticket, avatar: next }); // optimistic — the queue catches up on reload
    try {
      const res = await fetch(`/api/public/w/${slug}/signups`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: ticket.code, avatar: next }),
      });
      const data = await res.json();
      if (res.ok) {
        saveTicket({ ...ticket, avatar: data.avatar, earned: data.earned, position: data.position });
      }
    } catch {
      /* offline — the optimistic face stays until next visit */
    }
  }

  async function copy() {
    if (!ticket) return;
    await navigator.clipboard.writeText(ticket.referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (ticket) {
    const earnedLevel = ticket.earned?.includes("glow")
      ? 10
      : ticket.earned?.includes("pennant")
        ? 5
        : ticket.earned?.includes("balloon")
          ? 1
          : 0;
    const canCustomize = avatarsEnabled && ticket.code && ticket.avatar;

    return (
      <div className="q-card q-ticket" role="status">
        <div className="q-ticket-top">
          {avatarsEnabled && ticket.avatar ? (
            <div className={`q-ticket-avatar${justJoined ? " q-pop" : ""}`}>
              <QueueAvatar avatar={ticket.avatar} earned={ticket.earned} title="Your queue avatar" />
            </div>
          ) : null}
          <div>
            <div className="q-ticket-label">{successMessage}</div>
            <div className="q-ticket-position">#{ticket.position.toLocaleString()}</div>
            <div className="q-ticket-sub">
              {avatarsEnabled
                ? "Your place in line — this face stands at your spot in the queue."
                : "Your place in line."}
            </div>
          </div>
        </div>

        {canCustomize ? (
          <div className="q-knobs">
            <div>
              <div className="q-knob-label">Expression</div>
              <div className="q-opts" role="group" aria-label="Choose an expression">
                {AVATAR_EXPRESSIONS.map((expr) => (
                  <button
                    key={expr}
                    type="button"
                    className="q-opt"
                    aria-label={EXPRESSION_LABELS[expr]}
                    aria-pressed={ticket.avatar!.expression === expr}
                    onClick={() => updateAvatar({ expression: expr })}
                  >
                    <QueueAvatar
                      avatar={{ expression: expr, accessory: "none", color: "#ffd166" }}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="q-knob-label">Accessory</div>
              <div className="q-opts" role="group" aria-label="Choose an accessory">
                {AVATAR_ACCESSORIES.map((acc) => (
                  <button
                    key={acc}
                    type="button"
                    className="q-opt"
                    aria-label={ACCESSORY_LABELS[acc]}
                    aria-pressed={ticket.avatar!.accessory === acc}
                    onClick={() => updateAvatar({ accessory: acc })}
                  >
                    <QueueAvatar
                      avatar={{ expression: "smile", accessory: acc, color: "#9ecbf5" }}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="q-knob-label">Color</div>
              <div className="q-opts" role="group" aria-label="Choose a color">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="q-swatch"
                    style={{ background: color }}
                    aria-label={`Color ${color}`}
                    aria-pressed={ticket.avatar!.color === color}
                    onClick={() => updateAvatar({ color })}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {referralsEnabled ? (
          <div className="q-referral">
            <div className="q-ticket-label">
              Skip ahead — each friend who joins moves you up
            </div>
            <div className="q-referral-row">
              <span className="q-referral-url">{ticket.referralUrl}</span>
              <button type="button" className="q-copy" onClick={copy}>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            {avatarsEnabled ? (
              <div className="q-milestones" aria-label="Items you can earn by referring friends">
                {MILESTONES.map((m) => (
                  <span
                    key={m.item}
                    className={`q-milestone${earnedLevel >= m.friends ? " q-milestone--earned" : ""}`}
                  >
                    <QueueAvatar avatar={CHIP_FACE} earned={[m.item]} />
                    <span>
                      <b>{m.name}</b>
                      {m.friends} {m.friends === 1 ? "friend" : "friends"}
                    </span>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem" }}>
      <div className="q-form">
        <input
          className="q-input"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email address"
        />
        <button className="q-btn" type="submit" disabled={busy}>
          {busy ? "Joining…" : buttonText}
        </button>
      </div>
      {error ? <p className="q-error">{error}</p> : null}
    </form>
  );
}
