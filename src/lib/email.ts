import nodemailer from "nodemailer";
import { BRAND } from "@/lib/brand";

/** Primary inbox for website enquiries */
export const NOTIFY_TO =
  process.env.NOTIFY_EMAIL?.trim() || BRAND.email;

export const NOTIFY_TO_NAME =
  process.env.NOTIFY_NAME?.trim() || BRAND.emailName;

type SendEmailInput = {
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

function smtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
  );
}

async function sendViaSmtp(
  input: SendEmailInput
): Promise<{ sent: boolean; id?: string; error?: string }> {
  const host = process.env.SMTP_HOST!.trim();
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER!.trim();
  const pass = process.env.SMTP_PASS!.trim();
  const from =
    process.env.EMAIL_FROM?.trim() ||
    `${BRAND.agentName} website <${user}>`;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from,
      to: NOTIFY_TO,
      replyTo: input.replyTo || undefined,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    return { sent: true, id: info.messageId };
  } catch (err) {
    const error = err instanceof Error ? err.message : "SMTP send failed";
    console.error("[email] SMTP failed:", error);
    return { sent: false, error };
  }
}

async function sendViaResend(
  input: SendEmailInput
): Promise<{ sent: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY!.trim();
  const from =
    process.env.EMAIL_FROM?.trim() ||
    `${BRAND.agentName} website <onboarding@resend.dev>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        // Plain address required — "Name <email>" fails Resend's unverified-domain checks
        to: [NOTIFY_TO],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo || undefined,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };

    if (!res.ok) {
      const error = data.message || data.name || `Resend HTTP ${res.status}`;
      console.error("[email] Resend failed:", error);
      return { sent: false, error };
    }

    return { sent: true, id: data.id };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Email send failed";
    console.error("[email]", error);
    return { sent: false, error };
  }
}

/**
 * Send transactional mail via Resend or SMTP.
 * Prefer RESEND_API_KEY; otherwise SMTP_HOST + SMTP_USER + SMTP_PASS.
 */
export async function sendNotificationEmail(
  input: SendEmailInput
): Promise<{ sent: boolean; id?: string; error?: string }> {
  if (process.env.RESEND_API_KEY?.trim()) {
    return sendViaResend(input);
  }

  if (smtpConfigured()) {
    return sendViaSmtp(input);
  }

  console.warn(
    "[email] No RESEND_API_KEY or SMTP_* configured — enquiry not emailed"
  );
  return {
    sent: false,
    error: "Email not configured (set RESEND_API_KEY or SMTP_HOST/USER/PASS)",
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rowsHtml(fields: { label: string; value: string }[]): string {
  return fields
    .map(
      (field) =>
        `<p style="margin:0 0 12px"><strong>${escapeHtml(field.label)}</strong><br/>${escapeHtml(field.value).replace(/\n/g, "<br/>")}</p>`
    )
    .join("");
}

function rowsText(fields: { label: string; value: string }[]): string {
  return fields.map((field) => `${field.label}: ${field.value}`).join("\n\n");
}

export async function notifyAppraisalLead(input: {
  name: string;
  email: string;
  phone?: string | null;
  address: string;
  message?: string | null;
}) {
  const fields = [
    { label: "Name", value: input.name },
    { label: "Email", value: input.email },
    { label: "Phone", value: input.phone || "—" },
    { label: "Property address", value: input.address },
    { label: "Message", value: input.message || "—" },
  ];

  return sendNotificationEmail({
    subject: `Appraisal request — ${input.address}`,
    replyTo: input.email,
    html: `
      <h2 style="margin:0 0 16px;font-family:sans-serif">New appraisal request</h2>
      ${rowsHtml(fields)}
      <p style="margin:24px 0 0;color:#666;font-size:12px;font-family:sans-serif">
        Sent from ${escapeHtml(BRAND.agentName)} website appraisal form.
      </p>
    `,
    text: `New appraisal request\n\n${rowsText(fields)}\n`,
  });
}

export async function notifyContactLead(input: {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
}) {
  const fields = [
    { label: "Name", value: input.name },
    { label: "Email", value: input.email },
    { label: "Phone", value: input.phone || "—" },
    { label: "Message", value: input.message },
  ];

  return sendNotificationEmail({
    subject: `Website enquiry — ${input.name}`,
    replyTo: input.email,
    html: `
      <h2 style="margin:0 0 16px;font-family:sans-serif">New contact enquiry</h2>
      ${rowsHtml(fields)}
      <p style="margin:24px 0 0;color:#666;font-size:12px;font-family:sans-serif">
        Sent from ${escapeHtml(BRAND.agentName)} website contact form.
      </p>
    `,
    text: `New contact enquiry\n\n${rowsText(fields)}\n`,
  });
}
