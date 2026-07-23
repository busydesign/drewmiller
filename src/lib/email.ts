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

/**
 * Send transactional mail via Resend.
 * Requires RESEND_API_KEY. Optional EMAIL_FROM (verified domain in production).
 */
export async function sendNotificationEmail(
  input: SendEmailInput
): Promise<{ sent: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn(
      "[email] RESEND_API_KEY is not set — enquiry saved but email not sent"
    );
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

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
        to: [`${NOTIFY_TO_NAME} <${NOTIFY_TO}>`],
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
