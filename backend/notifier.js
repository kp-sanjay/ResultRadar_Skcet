import twilio from 'twilio';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Twilio client
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

// Initialize Nodemailer transporter
let emailTransporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

/**
 * Send notification via WhatsApp or Email
 * @param {Object} user - User object with name, whatsapp, email
 * @param {string} resultHtml - HTML content of the result
 * @returns {Promise<{success: boolean, method: string, error: string|null}>}
 */
export async function sendNotification(user, resultHtml) {
  const message = `🎉 Result Available!\n\nHello ${user.name},\n\nYour exam result for Roll Number ${user.rollno} has been released!\n\nPlease check the Auto Result Notifier app to view and download your result.\n\nThank you!`;
  
  // Try WhatsApp first
  if (user.whatsapp && twilioClient) {
    try {
      await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
        to: `whatsapp:${user.whatsapp}`,
        body: message
      });
      console.log(`WhatsApp notification sent to ${user.whatsapp}`);
      return { success: true, method: 'whatsapp', error: null };
    } catch (error) {
      console.error('WhatsApp notification failed:', error.message);
      // Fall through to email
    }
  }
  
  // Fallback to Email
  if (user.email && emailTransporter) {
    try {
      await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: user.email,
        subject: '🎉 Your Exam Result is Available!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Result Available!</h2>
            <p>Hello ${user.name},</p>
            <p>Your exam result for <strong>Roll Number ${user.rollno}</strong> has been released!</p>
            <p>Please check the Auto Result Notifier app to view and download your result.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">This is an automated notification from Auto Result Notifier.</p>
          </div>
        `,
        text: message
      });
      console.log(`Email notification sent to ${user.email}`);
      return { success: true, method: 'email', error: null };
    } catch (error) {
      console.error('Email notification failed:', error.message);
      return { success: false, method: 'email', error: error.message };
    }
  }
  
  // If both fail
  return { 
    success: false, 
    method: 'none', 
    error: 'Neither WhatsApp nor Email configured or available' 
  };
}

/**
 * Check if notification services are configured
 */
export function isNotificationConfigured() {
  const hasWhatsApp = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  const hasEmail = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  return { hasWhatsApp, hasEmail };
}

