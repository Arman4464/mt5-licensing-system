import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface LicenseExpiringEmailProps {
  licenseKey: string
  productName: string
  daysRemaining: number
  userName: string
}

export default function LicenseExpiringEmail({
  licenseKey,
  productName,
  daysRemaining,
  userName,
}: LicenseExpiringEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your {productName} License Expires in {daysRemaining} Days</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>⚠️ License Expiring Soon</Heading>
          <Text style={text}>Hello {userName},</Text>
          <Text style={text}>
            Your license for <strong>{productName}</strong> will expire in{' '}
            <strong style={{ color: '#f59e0b' }}>{daysRemaining} days</strong>.
          </Text>
          
          <Section style={warningBox}>
            <Text style={codeLabel}>License Key</Text>
            <Text style={codeText}>{licenseKey}</Text>
          </Section>

          <Text style={text}>
            To continue using the EA without interruption, please renew your license before it expires.
          </Text>

          <Button style={button} href={`https://mark8pips.vercel.app/renew?key=${licenseKey}`}>
            Renew License Now
          </Button>

          <Text style={footer}>
            Questions? Reply to this email or contact support@mark8pips.com
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#333',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
}

const warningBox = {
  background: '#fef3c7',
  borderLeft: '4px solid #f59e0b',
  borderRadius: '8px',
  margin: '30px 40px',
  padding: '20px',
}

const codeLabel = {
  color: '#92400e',
  fontSize: '12px',
  fontWeight: 'bold',
  letterSpacing: '1px',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
}

const codeText = {
  color: '#92400e',
  fontFamily: 'monospace',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '2px',
}

const button = {
  backgroundColor: '#f59e0b',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  padding: '14px',
  margin: '30px auto',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 40px',
  marginTop: '40px',
  textAlign: 'center' as const,
}
