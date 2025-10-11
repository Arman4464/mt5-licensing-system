import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendLicenseExpiringEmail(
  userEmail: string,
  licenseKey: string,
  productName: string,
  daysRemaining: number
) {
  try {
    await resend.emails.send({
      from: 'Mark8Pips <noreply@mark8pips.com>',
      to: userEmail,
      subject: `⚠️ Your ${productName} License Expires in ${daysRemaining} Days`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">⚠️ License Expiring Soon</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #374151;">Hello,</p>
            <p style="font-size: 16px; color: #374151;">
              Your license for <strong>${productName}</strong> will expire in <strong style="color: #f59e0b;">${daysRemaining} days</strong>.
            </p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">License Key</p>
              <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 18px; color: #111827;"><strong>${licenseKey}</strong></p>
            </div>
            <p style="font-size: 16px; color: #374151;">
              To continue using the EA without interruption, please renew your license.
            </p>
            <a href="https://mark8pips.vercel.app/renew?key=${licenseKey}" 
               style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 600;">
              Renew Now →
            </a>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated email from Mark8Pips License System.<br/>
              Visit <a href="https://mark8pips.vercel.app" style="color: #667eea;">mark8pips.vercel.app</a>
            </p>
          </div>
        </div>
      `,
    })
    console.log('✅ Email sent to:', userEmail)
  } catch (error) {
    console.error('❌ Email error:', error)
  }
}

export async function sendNewAccountAlert(
  adminEmail: string,
  licenseKey: string,
  accountNumber: number,
  brokerServer: string
) {
  await resend.emails.send({
    from: 'Mark8Pips System <alerts@mark8pips.com>',
    to: adminEmail,
    subject: `🔔 New MT5 Account Registered - ${accountNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #10b981;">✅ New MT5 Account Registered</h2>
        <table style="border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">License:</td>
            <td style="padding: 8px; font-family: monospace;">${licenseKey}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Account:</td>
            <td style="padding: 8px;">${accountNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Broker:</td>
            <td style="padding: 8px;">${brokerServer}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Time:</td>
            <td style="padding: 8px;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
        <a href="https://mark8pips.vercel.app/admin/licenses" 
           style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">
          View in Admin Panel
        </a>
      </div>
    `,
  })
}

export async function sendLicenseCreatedEmail(
  userEmail: string,
  licenseKey: string,
  productName: string,
  expiresAt: string
) {
  await resend.emails.send({
    from: 'Mark8Pips <licenses@mark8pips.com>',
    to: userEmail,
    subject: `🎉 Your ${productName} License is Ready!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🎉 Welcome to Mark8Pips!</h1>
          <p style="color: white; margin-top: 10px;">Your license is ready to use</p>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
          <h2 style="color: #111827; margin-top: 0;">Product: ${productName}</h2>
          <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your License Key</p>
            <p style="margin: 10px 0 0 0; font-family: 'Courier New', monospace; font-size: 20px; color: #111827; font-weight: bold;">${licenseKey}</p>
          </div>
          <p style="color: #374151;">Valid until: <strong>${new Date(expiresAt).toLocaleDateString()}</strong></p>
          
          <h3 style="color: #111827; margin-top: 30px;">📥 Installation Steps:</h3>
          <ol style="color: #374151; line-height: 1.8;">
            <li>Open MetaTrader 5</li>
            <li>Go to Tools → Options → Expert Advisors</li>
            <li>Enable "Allow WebRequest for listed URL"</li>
            <li>Add: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">https://mark8pips.vercel.app</code></li>
            <li>Install the EA and enter your license key</li>
          </ol>
          
          <a href="https://mark8pips.vercel.app/docs/installation" 
             style="display: inline-block; padding: 14px 28px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 600;">
            📖 Full Installation Guide
          </a>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="color: #9ca3af; font-size: 12px;">
            Need help? Contact us at support@mark8pips.com<br/>
            <a href="https://mark8pips.vercel.app" style="color: #667eea;">Visit Mark8Pips</a>
          </p>
        </div>
      </div>
    `,
  })
}
