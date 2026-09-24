import nodemailer from 'nodemailer';

let cachedTransporter = null;
let cachedConfigKey = null;

const getTransporter = () => {
  const host = process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || '587', 10);
  const user = process.env.BREVO_SMTP_USER || process.env.SMTP_USER || process.env.SMTP_USERNAME || process.env.EMAIL_USER;
  const pass = process.env.BREVO_SMTP_KEY || process.env.BREVO_SMTP_PASS || process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASS;

  const currentConfigKey = `${host}:${port}:${user}:${pass}`;

  if (cachedTransporter && cachedConfigKey === currentConfigKey) {
    return cachedTransporter;
  }

  const isSecure = port === 465;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    requireTLS: !isSecure,
    auth: {
      user,
      pass,
    },
    // Fast socket & connection timeouts to fail quickly on network/SMTP issues
    connectionTimeout: 8000, // 8 seconds
    greetingTimeout: 8000,   // 8 seconds
    socketTimeout: 10000,    // 10 seconds
    dnsTimeout: 5000,        // 5 seconds
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  cachedConfigKey = currentConfigKey;
  return cachedTransporter;
};

/**
 * Send 6-digit OTP email via SMTP / Nodemailer
 * @param {Object} params - { toEmail, otp }
 */
export const sendOtpEmail = async ({ toEmail, otp }) => {
  const host = process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || '587', 10);
  const user = process.env.BREVO_SMTP_USER || process.env.SMTP_USER || process.env.SMTP_USERNAME || process.env.EMAIL_USER;
  const pass = process.env.BREVO_SMTP_KEY || process.env.BREVO_SMTP_PASS || process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASS;
  const rawFrom = process.env.BREVO_FROM_EMAIL || process.env.SMTP_FROM || process.env.FROM_EMAIL || process.env.EMAIL_FROM || user;

  console.log(`[EMAIL] Email send started for recipient: ${toEmail} | Host: ${host}:${port} | User Configured: ${Boolean(user)} | Key Configured: ${Boolean(pass)} | From Configured: ${Boolean(rawFrom)}`);

  if (!user || !pass) {
    const errorMsg = 'SMTP credentials (user or password/key) are missing in environment variables.';
    console.error('[EMAIL] SMTP connection: FAILED - Missing credentials');
    throw new Error(errorMsg);
  }

  if (!rawFrom) {
    const errorMsg = 'Sender email (BREVO_FROM_EMAIL or SMTP_FROM) is missing in environment variables.';
    console.error('[EMAIL] SMTP connection: FAILED - Missing sender email');
    throw new Error(errorMsg);
  }

  // Format from header safely to avoid double angle brackets if full address string is provided
  let fromHeader = rawFrom.trim();
  if (!fromHeader.includes('<')) {
    fromHeader = `"ChainShield Security" <${fromHeader}>`;
  }

  const transporter = getTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ChainShield Security Verification</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #050d18; color: #e2e8f0; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #0b1726; border: 1px solid #1c3045; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
        .header { background: linear-gradient(135deg, #0b1726 0%, #102a45 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #1c3045; }
        .logo-title { color: #3b82f6; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; margin: 0; }
        .subtitle { color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
        .content { padding: 32px 28px; text-align: center; }
        .title { color: #ffffff; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 12px; }
        .text { color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { background: #07111f; border: 1px solid #2563eb; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #60a5fa; letter-spacing: 10px; margin: 0; }
        .expiry { color: #f59e0b; font-size: 13px; font-weight: 500; margin-top: 8px; }
        .warning-box { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 14px 16px; text-align: left; border-radius: 4px; margin-top: 28px; }
        .warning-text { color: #fca5a5; font-size: 13px; line-height: 1.5; margin: 0; }
        .footer { background-color: #07111f; padding: 20px; text-align: center; border-top: 1px solid #1c3045; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo-title">🛡️ ChainShield</h1>
          <div class="subtitle">Cyber Incident & Evidence Management System</div>
        </div>
        <div class="content">
          <h2 class="title">Password Reset Verification Code</h2>
          <p class="text">You have requested to reset your password for your ChainShield account. Please use the 6-digit Security Verification Code below to complete the verification process:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="expiry">⏱️ Valid for 10 minutes</div>
          </div>
          <div class="warning-box">
            <p class="warning-text"><strong>Security Notice:</strong> Do not share this OTP with anyone, including ChainShield support. If you did not request a password reset, your account is still secure, but please notify your security team immediately.</p>
          </div>
        </div>
        <div class="footer">
          &copy; 2026 ChainShield. All rights reserved. Secure Evidence & Verification Platform.
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: fromHeader,
    to: toEmail,
    subject: `ChainShield Password Reset Code`,
    html: htmlContent,
    text: `Your ChainShield password reset verification code is: ${otp}. It will expire in 10 minutes. If you did not request this, please ignore this message.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] OTP send: SUCCESS (MessageId: ${info.messageId})`);
    return info;
  } catch (sendErr) {
    console.error('[EMAIL] OTP send: FAILED');
    console.error('[EMAIL] Error details:', sendErr.message || sendErr.code || sendErr);
    // Invalidate cached transporter on failure so next request resets pool
    cachedTransporter = null;
    cachedConfigKey = null;
    throw sendErr;
  }
};
