import { Resend } from 'resend'
import { render } from '@react-email/components'
import LicenseCreatedEmail from '@/emails/license-created'
import LicenseExpiringEmail from '@/emails/license-expiring'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendLicenseCreatedEmail(
  userEmail: string,
  licenseKey: string,
  productName: string,
  expiresAt: string
) {
  try {
    const emailHtml = await render(
      LicenseCreatedEmail({
        licenseKey,
        productName,
        expiresAt,
        userName: userEmail.split('@')[0],
      })
    )

    const { data, error } = await resend.emails.send({
      from: 'Mark8Pips <onboarding@resend.dev>',
      to: userEmail,
      subject: `🎉 Your ${productName} License is Ready!`,
      html: emailHtml,
    })

    if (error) {
      console.error('❌ Email send error:', error)
      throw error
    }

    console.log('✅ Email sent successfully:', data)
    return data
  } catch (error) {
    console.error('❌ Email error:', error)
    throw error
  }
}

export async function sendLicenseExpiringEmail(
  userEmail: string,
  licenseKey: string,
  productName: string,
  daysRemaining: number
) {
  try {
    const emailHtml = await render(
      LicenseExpiringEmail({
        licenseKey,
        productName,
        daysRemaining,
        userName: userEmail.split('@')[0],
      })
    )

    const { data, error } = await resend.emails.send({
      from: 'Mark8Pips <onboarding@resend.dev>',
      to: userEmail,
      subject: `⚠️ Your ${productName} License Expires in ${daysRemaining} Days`,
      html: emailHtml,
    })

    if (error) {
      console.error('❌ Email send error:', error)
      throw error
    }

    console.log('✅ Email sent successfully:', data)
    return data
  } catch (error) {
    console.error('❌ Email error:', error)
    throw error
  }
}

export async function sendLicenseExpiredEmail(
  userEmail: string,
  licenseKey: string,
  productName: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Mark8Pips <onboarding@resend.dev>',
      to: userEmail,
      subject: `❌ Your ${productName} License Has Expired`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ef4444;">❌ License Expired</h1>
          <p>Your license for <strong>${productName}</strong> has expired.</p>
          <p><strong>License Key:</strong> <code>${licenseKey}</code></p>
          <p>Your EA has been automatically deactivated. Renew now to restore access.</p>
          <a href="https://mark8pips.vercel.app/renew?key=${licenseKey}" 
             style="display: inline-block; padding: 14px 28px; background: #ef4444; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px;">
            Renew License
          </a>
        </div>
      `,
    })

    if (error) {
      console.error('❌ Email send error:', error)
      throw error
    }

    console.log('✅ Email sent successfully:', data)
    return data
  } catch (error) {
    console.error('❌ Email error:', error)
    throw error
  }
}

export async function sendNewAccountAlert(
  adminEmail: string,
  licenseKey: string,
  accountNumber: number,
  brokerServer: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Mark8Pips System <onboarding@resend.dev>',
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

    if (error) {
      console.error('❌ Email send error:', error)
    }

    return data
  } catch (error) {
    console.error('❌ Email error:', error)
  }
}
