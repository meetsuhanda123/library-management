/**
 * Brevo (Sendinblue) Transactional Email Service
 * Uses Brevo v3 REST API. Fully functional when BREVO_API_KEY is configured.
 */

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

async function sendEmail({ to, subject, htmlContent, textContent }) {
  const apiKey = (process.env.BREVO_API_KEY || "").trim();
  const senderEmail = (process.env.BREVO_SENDER_EMAIL || "").trim();
  const senderName = (process.env.BREVO_SENDER_NAME || "LibraryHub Notifications").trim();

  if (!apiKey) {
    console.warn(`[Brevo Email Service] Skipped email to ${to} (BREVO_API_KEY not configured). Subject: "${subject}"`);
    return { success: false, reason: "BREVO_API_KEY_NOT_SET" };
  }

  if (!senderEmail) {
    console.warn(`[Brevo Email Service] Skipped email to ${to} (BREVO_SENDER_EMAIL not configured). Subject: "${subject}"`);
    return { success: false, reason: "BREVO_SENDER_EMAIL_NOT_SET" };
  }

  try {
    const payload = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to.trim() }],
      subject,
      htmlContent,
      textContent: textContent || subject,
    };

    console.log(`[Brevo Email Dispatch] Sending "${subject}" to ${to} from ${senderName} <${senderEmail}>`);

    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(`[Brevo Email Error] HTTP ${response.status}:`, JSON.stringify(data));
      return { success: false, status: response.status, error: data };
    }

    console.log(`[Brevo Email Sent] Successfully accepted by Brevo for ${to} (MessageId: ${data.messageId})`);
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error("[Brevo Email Request Failed]:", error.message);
    return { success: false, error: error.message };
  }
}

// 1. Welcome / Registration Email
async function sendWelcomeEmail(user) {
  if (!user || !user.email) return;
  return sendEmail({
    to: user.email,
    subject: "Welcome to LibraryHub! 📖",
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 22px;">Welcome to LibraryHub, ${user.name}!</h1>
          <p style="color: #64748b; font-size: 14px; margin: 6px 0 0;">Your digital library account has been successfully created.</p>
        </div>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          You can now browse our catalog, search and filter books, and manage your borrowed reads directly from your online member portal.
        </p>
        <div style="margin: 20px 0; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 13px; color: #475569;"><strong>Member Name:</strong> ${user.name}</p>
          <p style="margin: 6px 0 0; font-size: 13px; color: #475569;"><strong>Account Email:</strong> ${user.email}</p>
          <p style="margin: 6px 0 0; font-size: 13px; color: #475569;"><strong>Role:</strong> <span style="background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase;">${user.role}</span></p>
        </div>
        <p style="margin-top: 24px; font-size: 13px; color: #94a3b8; text-align: center;">© 2026 LibraryHub · Happy Reading!</p>
      </div>
    `,
  });
}

// 2. Book Borrowing Confirmation Email
async function sendBorrowConfirmation(user, book, record) {
  if (!user || !user.email || !book) return;
  const dueDateStr = record && record.dueDate
    ? new Date(record.dueDate).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "14 days from checkout";

  return sendEmail({
    to: user.email,
    subject: `Book Borrowed: "${book.title}" 📚`,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
          <h2 style="color: #0f172a; margin: 0; font-size: 20px;">Book Checkout Confirmation</h2>
          <p style="color: #64748b; font-size: 14px; margin: 6px 0 0;">Hello ${user.name}, you have checked out a book from LibraryHub.</p>
        </div>
        <div style="margin: 16px 0; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h3 style="margin: 0; color: #0f172a; font-size: 16px;">"${book.title}"</h3>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">By ${book.author} · Category: ${book.category || 'General'}</p>
        </div>
        <div style="margin: 16px 0; padding: 16px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px;">
          <p style="margin: 0; color: #065f46; font-size: 14px;"><strong>Due Date:</strong> ${dueDateStr}</p>
          <p style="margin: 6px 0 0; color: #065f46; font-size: 13px;">Please return or renew your loan before this date to avoid overdue charges (₹5/day).</p>
        </div>
        <p style="font-size: 13px; color: #64748b; margin-top: 16px;">View and manage your active loans anytime under <strong>My Books</strong> on the website.</p>
        <p style="margin-top: 24px; font-size: 13px; color: #94a3b8; text-align: center;">© 2026 LibraryHub</p>
      </div>
    `,
  });
}

// 3. Book Return Confirmation Email
async function sendReturnConfirmation(user, book) {
  if (!user || !user.email || !book) return;
  return sendEmail({
    to: user.email,
    subject: `Book Returned: "${book.title}" ✓`,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
          <h2 style="color: #065f46; margin: 0; font-size: 20px;">✓ Book Return Confirmed</h2>
          <p style="color: #64748b; font-size: 14px; margin: 6px 0 0;">Hello ${user.name}, thank you for returning your book.</p>
        </div>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Your return for <strong>"${book.title}"</strong> by ${book.author} has been processed. The book is now returned to circulation for other patrons.
        </p>
        <div style="margin: 16px 0; padding: 12px 16px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 13px; color: #64748b;">Return Date: <strong>${new Date().toLocaleDateString("en-US", { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</strong></p>
        </div>
        <p style="margin-top: 24px; font-size: 13px; color: #94a3b8; text-align: center;">© 2026 LibraryHub</p>
      </div>
    `,
  });
}

// 4. Overdue Notice Email
async function sendOverdueNotice(user, book, record) {
  if (!user || !user.email || !book) return;
  const daysOverdue = record?.daysOverdue || Math.max(1, Math.ceil((new Date() - new Date(record.dueDate)) / (1000 * 60 * 60 * 24)));
  const fine = record?.fine || daysOverdue * 5;

  return sendEmail({
    to: user.email,
    subject: `OVERDUE NOTICE: "${book.title}" ⚠️`,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: auto; padding: 28px; border: 1px solid #fecaca; border-radius: 12px; background: #ffffff;">
        <div style="margin-bottom: 20px; border-bottom: 2px solid #fee2e2; padding-bottom: 16px;">
          <h2 style="color: #991b1b; margin: 0; font-size: 20px;">⚠️ Library Overdue Notice</h2>
          <p style="color: #7f1d1d; font-size: 14px; margin: 6px 0 0;">Hello ${user.name}, your borrowed book is past its due date.</p>
        </div>
        <p style="color: #334155; font-size: 15px;">
          The book <strong>"${book.title}"</strong> was due on <strong>${new Date(record.dueDate).toLocaleDateString()}</strong>.
        </p>
        <div style="margin: 16px 0; padding: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
          <p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>Days Overdue:</strong> ${daysOverdue} days</p>
          <p style="margin: 6px 0 0; color: #991b1b; font-size: 14px;"><strong>Accrued Fine:</strong> ₹${fine} (₹5 per day)</p>
        </div>
        <p style="font-size: 13px; color: #475569;">Please return the book as soon as possible to avoid further charges.</p>
        <p style="margin-top: 24px; font-size: 13px; color: #94a3b8; text-align: center;">© 2026 LibraryHub</p>
      </div>
    `,
  });
}

// 5. Brevo Configuration Diagnostic Check
async function verifyBrevoConfig() {
  const apiKey = (process.env.BREVO_API_KEY || "").trim();
  const senderEmail = (process.env.BREVO_SENDER_EMAIL || "").trim();
  const senderName = (process.env.BREVO_SENDER_NAME || "").trim();

  const isConfigured = Boolean(apiKey && senderEmail);
  const keyLength = apiKey ? apiKey.length : 0;
  const isStandardFormat = apiKey.startsWith("xkeysib-");

  let apiConnection = null;
  if (apiKey) {
    try {
      const res = await fetch("https://api.brevo.com/v3/account", {
        headers: { "accept": "application/json", "api-key": apiKey },
      });
      const data = await res.json().catch(() => ({}));
      apiConnection = {
        status: res.status,
        ok: res.ok,
        data: res.ok
          ? { email: data.email, companyName: data.companyName, plan: data.plan }
          : data,
      };
    } catch (e) {
      apiConnection = { status: "network_error", error: e.message };
    }
  }

  return {
    isConfigured,
    senderEmail,
    senderName,
    keyLength,
    isStandardFormat,
    apiConnection,
  };
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendBorrowConfirmation,
  sendReturnConfirmation,
  sendOverdueNotice,
  verifyBrevoConfig,
};
