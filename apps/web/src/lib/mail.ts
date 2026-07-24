import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  resendClient ??= new Resend(apiKey);
  return resendClient;
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  const resend = getResend();
  const from = process.env.EMAIL_FROM ?? "ValensCRM <onboarding@resend.dev>";

  if (!resend) {
    console.log(`[mail] RESEND_API_KEY not set — logging instead of sending.`);
    console.log(`[mail] To: ${to}\nSubject: ${subject}\n${text}`);
    return;
  }

  const { error } = await resend.emails.send({ from, to, subject, html, text });
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

export async function sendVerificationEmail(email: string, verifyUrl: string) {
  await sendEmail(
    email,
    "Verify your ValensCRM email address",
    `<p>Thanks for signing up for ValensCRM!</p>
     <p><a href="${verifyUrl}">Click here to verify your email address</a>.</p>`,
    `Verify your ValensCRM email address: ${verifyUrl}`,
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
