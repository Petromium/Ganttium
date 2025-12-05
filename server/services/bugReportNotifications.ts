/**
 * Bug Report Email Notifications
 * Sends email notifications to users when they submit bug reports and when reports are resolved
 */

import { sendEmail } from "../emailService";
import { BugReport } from "@shared/schema";
import { logger } from "./cloudLogging";

/**
 * Send initial notification when bug report is submitted
 */
export async function sendBugReportInitialNotification(
  userEmail: string,
  bugReport: BugReport
): Promise<void> {
  try {
    const subject = "Thank you for your report - Ganttium";
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .report-id { background-color: #e0e7ff; padding: 10px; border-radius: 4px; margin: 20px 0; font-family: monospace; }
            .message { background-color: white; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Your Report</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              
              <p>We've received your ${bugReport.category === "bug" ? "bug report" : bugReport.category === "feature-request" ? "feature request" : "feedback"} and want to thank you for taking the time to help us improve Ganttium.</p>
              
              <div class="report-id">
                <strong>Report ID:</strong> #${bugReport.id}
              </div>
              
              <div class="message">
                <strong>Title:</strong> ${escapeHtml(bugReport.title)}<br><br>
                <strong>Category:</strong> ${bugReport.category}<br>
                <strong>Severity:</strong> ${bugReport.severity || "Medium"}
              </div>
              
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Our team will review your report within 2-3 business days</li>
                <li>We take all reports seriously, regardless of your subscription tier</li>
                <li>You'll receive an email notification when your report is resolved</li>
                <li>You can track your report status in your account</li>
              </ul>
              
              <p>We appreciate your feedback and are committed to making Ganttium the best project management tool for EPC teams.</p>
              
              <p>Best regards,<br>The Ganttium Team</p>
              
              <div class="footer">
                <p>This is an automated notification. Please do not reply to this email.</p>
                <p>If you have questions, please contact us through the app.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail({
      to: userEmail,
      subject,
      htmlContent,
    });

    logger.info("[BUG_REPORT] Initial notification sent", {
      reportId: bugReport.id,
      userEmail,
    });
  } catch (error) {
    logger.error("[BUG_REPORT] Failed to send initial notification", error);
    throw error;
  }
}

/**
 * Send resolution notification when bug report is resolved
 */
export async function sendBugReportResolutionNotification(
  userEmail: string,
  bugReport: BugReport
): Promise<void> {
  try {
    const subject = "Your report has been resolved - Ganttium";
    
    const resolutionText = bugReport.resolutionNotes 
      ? escapeHtml(bugReport.resolutionNotes)
      : "Your report has been reviewed and resolved by our team.";
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .report-id { background-color: #d1fae5; padding: 10px; border-radius: 4px; margin: 20px 0; font-family: monospace; }
            .resolution { background-color: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Report Resolved</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              
              <p>Great news! Your ${bugReport.category === "bug" ? "bug report" : bugReport.category === "feature-request" ? "feature request" : "feedback"} has been reviewed and resolved.</p>
              
              <div class="report-id">
                <strong>Report ID:</strong> #${bugReport.id}<br>
                <strong>Title:</strong> ${escapeHtml(bugReport.title)}
              </div>
              
              <div class="resolution">
                <strong>Resolution:</strong><br>
                ${resolutionText}
              </div>
              
              <p>Thank you for helping us improve Ganttium. Your feedback is invaluable to us!</p>
              
              <p>If you have any questions about this resolution or would like to provide additional feedback, please don't hesitate to reach out.</p>
              
              <p>Best regards,<br>The Ganttium Team</p>
              
              <div class="footer">
                <p>This is an automated notification. Please do not reply to this email.</p>
                <p>If you have questions, please contact us through the app.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail({
      to: userEmail,
      subject,
      htmlContent,
    });

    logger.info("[BUG_REPORT] Resolution notification sent", {
      reportId: bugReport.id,
      userEmail,
    });
  } catch (error) {
    logger.error("[BUG_REPORT] Failed to send resolution notification", error);
    throw error;
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

