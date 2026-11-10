type MailInput = { to: string; subject: string; text: string; html?: string };

/**
 * Sends email through Resend's HTTP API.
 * Env: RESEND_API_KEY, MAIL_FROM (e.g. "JNC Choral <no-reply@yourdomain.com>").
 * Without a key, mail is only logged in development; in production it fails
 * closed rather than leaking secrets anywhere.
 */
export async function sendMail({ to, subject, text, html }: MailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[mailer] (dev) email to ${to}: ${subject}\n${text}`);
      return { ok: true as const };
    }
    console.error("[mailer] RESEND_API_KEY / MAIL_FROM are not configured");
    return { ok: false as const };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, text, html }),
    });
    if (!res.ok) {
      console.error("[mailer] send failed", res.status, await res.text().catch(() => ""));
      return { ok: false as const };
    }
    return { ok: true as const };
  } catch (error) {
    console.error("[mailer] send error", error);
    return { ok: false as const };
  }
}
