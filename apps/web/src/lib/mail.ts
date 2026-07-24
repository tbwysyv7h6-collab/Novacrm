import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  resendClient ??= new Resend(apiKey);
  return resendClient;
}

type EmailAttachment = { filename: string; content: Buffer };

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
  attachments?: EmailAttachment[],
) {
  const resend = getResend();
  const from = process.env.EMAIL_FROM ?? "ValensCRM <onboarding@resend.dev>";

  if (!resend) {
    console.log(`[mail] RESEND_API_KEY not set — logging instead of sending.`);
    console.log(`[mail] To: ${to}\nSubject: ${subject}\n${text}`);
    if (attachments?.length) {
      console.log(`[mail] Attachments: ${attachments.map((a) => a.filename).join(", ")}`);
    }
    return;
  }

  const { error } = await resend.emails.send({ from, to, subject, html, text, attachments });
  if (error) {
    console.error(`[mail] Failed to send "${subject}" to ${to}:`, error);
  }
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await sendEmail(
    email,
    "Reset your ValensCRM password",
    `<p>We received a request to reset your ValensCRM password.</p>
     <p><a href="${resetUrl}">Click here to choose a new password</a>. This link expires in 1 hour.</p>
     <p>If you didn't request this, you can safely ignore this email.</p>`,
    `Reset your ValensCRM password: ${resetUrl} (expires in 1 hour)`,
  );
}

export async function sendAutomationEmail(to: string, subject: string, body: string) {
  await sendEmail(to, subject, `<p>${body.replace(/\n/g, "<br />")}</p>`, body);
}

export async function sendInviteEmail(
  email: string,
  inviteUrl: string,
  orgName: string,
  inviterName: string,
) {
  await sendEmail(
    email,
    `${inviterName} invited you to join ${orgName} on ValensCRM`,
    `<p><strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on ValensCRM.</p>
     <p><a href="${inviteUrl}">Click here to accept the invite</a>. This link expires in 7 days.</p>`,
    `${inviterName} invited you to join ${orgName} on ValensCRM: ${inviteUrl} (expires in 7 days)`,
  );
}

export async function sendVerificationEmail(email: string, verifyUrl: string) {
  await sendEmail(
    email,
    "Verify your ValensCRM email address",
    `<p>Thanks for signing up for ValensCRM!</p>
     <p><a href="${verifyUrl}">Click here to verify your email address</a>.</p>`,
    `Verify your ValensCRM email address: ${verifyUrl}`,
  );
}

export async function sendInvoiceEmail(details: {
  to: string;
  businessName: string;
  invoiceNumber: string;
  total: number;
  dueAt: Date | null;
  pdfBuffer: Buffer;
}) {
  const dueText = details.dueAt
    ? details.dueAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;
  const text = `Invoice ${details.invoiceNumber} from ${details.businessName}\n\nAmount due: £${details.total.toFixed(2)}${dueText ? `\nDue: ${dueText}` : ""}\n\nSee the attached PDF for full details.`;
  await sendEmail(
    details.to,
    `Invoice ${details.invoiceNumber} from ${details.businessName}`,
    `<p>You have a new invoice from <strong>${details.businessName}</strong>.</p>
     <p>Amount due: <strong>£${details.total.toFixed(2)}</strong>${dueText ? `<br />Due: ${dueText}` : ""}</p>
     <p>See the attached PDF for full details.</p>`,
    text,
    [{ filename: `${details.invoiceNumber}.pdf`, content: details.pdfBuffer }],
  );
}

function formatAppointmentTime(date: Date): string {
  return date.toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function sendBookingConfirmationEmail(details: {
  to: string;
  businessName: string;
  startsAt: Date;
}) {
  const when = formatAppointmentTime(details.startsAt);
  await sendEmail(
    details.to,
    `Booking confirmed with ${details.businessName}`,
    `<p>Your appointment with <strong>${details.businessName}</strong> is confirmed.</p>
     <p><strong>${when}</strong></p>`,
    `Your appointment with ${details.businessName} is confirmed for ${when}.`,
  );
}

export async function sendBookingNotificationEmail(details: {
  to: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  startsAt: Date;
}) {
  const when = formatAppointmentTime(details.startsAt);
  await sendEmail(
    details.to,
    `New booking: ${details.customerName} — ${when}`,
    `<p><strong>New appointment booked</strong></p>
     <p>${when}</p>
     <p>Name: ${details.customerName}<br />
     Email: ${details.customerEmail}${details.customerPhone ? `<br />Phone: ${details.customerPhone}` : ""}</p>`,
    `New appointment booked for ${when}\nName: ${details.customerName}\nEmail: ${details.customerEmail}${details.customerPhone ? `\nPhone: ${details.customerPhone}` : ""}`,
  );
}

export async function sendContactRequestEmail(details: {
  name: string;
  email: string;
  businessName: string;
  message: string;
}) {
  const notifyTo = process.env.CONTACT_REQUEST_TO ?? "hello@valenscrm.com";
  const text = `New contact request\n\nName: ${details.name}\nEmail: ${details.email}\nBusiness: ${details.businessName}\n\n${details.message}`;
  await sendEmail(
    notifyTo,
    `Contact request: ${details.businessName}`,
    `<p><strong>New contact request</strong></p>
     <p>Name: ${details.name}<br />
     Email: ${details.email}<br />
     Business: ${details.businessName}</p>
     <p>${details.message.replace(/\n/g, "<br />")}</p>`,
    text,
  );
}
