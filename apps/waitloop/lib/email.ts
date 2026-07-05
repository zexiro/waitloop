const FROM = process.env.EMAIL_FROM || "Waitloop <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Dev / self-host without email: print instead of sending.
    console.log(`\n--- email to ${to} ---\n${subject}\n${html.replace(/<[^>]+>/g, " ")}\n---\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) throw new Error(`email send failed: ${res.status} ${await res.text()}`);
}
