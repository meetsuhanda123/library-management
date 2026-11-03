/**
 * Brevo (Sendinblue) Transactional Email Service
 * Uses Brevo v3 REST API. Fully functional when BREVO_API_KEY is configured.
 */

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

async function sendEmail({ to, subject, htmlContent, textContent }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@libraryhub.local";
  const senderName = process.env.BREVO_SENDER_NAME || "LibraryHub Notifications";

  if (!apiKey) {
    console.log(`[Brevo Email Service] Skipped email to ${to} (BREVO_API_KEY not configured). Subject: "${subject}"`);
    return { success: false, reason: "BREVO_API_KEY_NOT_SET" };
  }

  try {
    const payload = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent,
      textContent: textContent || subject,
    };

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
      console.error("[Brevo Email Error]:", data);
      return { success: false, error: data };
    }

    console.log(`[Brevo Email Sent] Successfully sent "${subject}" to ${to} (MessageId: ${data.messageId})`);
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error("[Brevo Email Request Failed]:", error.message);
    return { success: false, error: error.message };
  }
}

// Pre-formatted email notifications
async function sendWelcomeEmail(user) {
  return sendEmail({
    to: user.email,
    subject: "Welcome to LibraryHub! 📖",
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 580px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a;">Welcome to LibraryHub, ${user.name}!</h2>
        <p style="color: #475569; font-size: 15px;">Your digital library account has been successfully created.</p>
        <p style="color: #475569; font-size: 15px;">You can now browse our catalog, save favourites, and borrow books online.</p>
        <div style="margin-top: 24px; padding: 12px; background: #f8fafc; border-radius: 6px;">
          <p style="margin: 0; font-size: 13px; color: #64748b;">Role: <strong>${user.role.toUpperCase()}</strong></p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">Account Email: <strong>${user.email}</strong></p>
        </div>
        <p style="margin-top: 24px; font-size: 13px; color: #94a3b8;">© 2026 LibraryHub · Happy Reading!</p>
      </div>
    `,
  });
}

async function sendBorrowConfirmation(user, book, record) {
  const dueDateStr = new Date(record.dueDate).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return sendEmail({
    to: user.email,
    subject: `Book Borrowed: "${book.title}" 📚`,
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 580px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a;">Book Borrowed Successfully</h2>
        <p style="color: #475569; font-size: 15px;">Hello ${user.name}, you have checked out <strong>"${book.title}"</strong> by ${book.author}.</p>
        <div style="margin: 16px 0; padding: 16px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px;">
          <p style="margin: 0; color: #065f46; font-size: 14px;"><strong>Due Date:</strong> ${dueDateStr}</p>
          <p style="margin: 4px 0 0; color: #065f46; font-size: 13px;">Please return or renew before this date to avoid overdue notices.</p>
        </div>
        <p style="font-size: 13px; color: #94a3b8;">You can manage your active loans at LibraryHub > My Books.</p>
      </div>
    `,
  });
}

async function sendReturnConfirmation(user, book) {
  return sendEmail({
    to: user.email,
    subject: `Book Returned: "${book.title}" ✓`,
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 580px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a;">Book Return Confirmed</h2>
        <p style="color: #475569; font-size: 15px;">Hello ${user.name}, thank you for returning <strong>"${book.title}"</strong>.</p>
        <p style="color: #475569; font-size: 14px;">The book has been marked as available in the library collection for other members.</p>
        <p style="margin-top: 24px; font-size: 13px; color: #94a3b8;">© 2026 LibraryHub</p>
      </div>
    `,
  });
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendBorrowConfirmation,
  sendReturnConfirmation,
};

