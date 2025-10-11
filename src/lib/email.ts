import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendLicenseExpiringEmail(
  userEmail: string,
  licenseKey: string,
  productName: string,
  daysRemaining: number
) {
  const mailOptions = {
    from: '"Mark8Pips" <noreply@mark8pips.com>',
    to: userEmail,
    subject: `⚠️ Your ${productName} License Expires in ${daysRemaining} Days`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">License Expiring Soon</h2>
        <p>Your license for <strong>${productName}</strong> will expire in <strong>${daysRemaining} days</strong>.</p>
        <p><strong>License Key:</strong> <code>${licenseKey}</code></p>
        <p>To continue using the EA without interruption, please renew your license.</p>
        <a href="https://mark8pips.vercel.app/renew?key=${licenseKey}" 
           style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Renew Now
        </a>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          This is an automated email from Mark8Pips License System.
        </p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('Email sent to:', userEmail)
  } catch (error) {
    console.error('Email error:', error)
  }
}

export async function sendNewAccountAlert(
  adminEmail: string,
  licenseKey: string,
  accountNumber: number,
  brokerServer: string
) {
  const mailOptions = {
    from: '"Mark8Pips System" <noreply@mark8pips.com>',
    to: adminEmail,
    subject: `🔔 New MT5 Account Registered`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h3>New MT5 Account Registered</h3>
        <ul>
          <li><strong>License:</strong> ${licenseKey}</li>
          <li><strong>Account:</strong> ${accountNumber}</li>
          <li><strong>Broker:</strong> ${brokerServer}</li>
          <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <a href="https://mark8pips.vercel.app/admin/licenses">View in Admin Panel</a>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

export async function sendLicenseExpiredEmail(
  userEmail: string,
  licenseKey: string,
  productName: string
) {
  const mailOptions = {
    from: '"Mark8Pips" <noreply@mark8pips.com>',
    to: userEmail,
    subject: `❌ Your ${productName} License Has Expired`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">License Expired</h2>
        <p>Your license for <strong>${productName}</strong> has expired.</p>
        <p><strong>License Key:</strong> <code>${licenseKey}</code></p>
        <p>Your EA has been automatically deactivated. Renew now to restore access.</p>
        <a href="https://mark8pips.vercel.app/renew?key=${licenseKey}" 
           style="display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Renew License
        </a>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}
