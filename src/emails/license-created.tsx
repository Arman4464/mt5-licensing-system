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

interface LicenseCreatedEmailProps {
  licenseKey: string
  productName: string
  expiresAt: string
  userName: string
}

export default function LicenseCreatedEmail({
  licenseKey,
  productName,
  expiresAt,
  userName,
}: LicenseCreatedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your {productName} License is Ready!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎉 Welcome to Mark8Pips!</Heading>
          <Text style={text}>Hello {userName},</Text>
          <Text style={text}>
            Your license for <strong>{productName}</strong> has been successfully generated and is ready to use!
          </Text>
          
          <Section style={codeBox}>
            <Text style={codeLabel}>Your License Key</Text>
            <Text style={codeText}>{licenseKey}</Text>
          </Section>

          <Text style={text}>
            <strong>Valid until:</strong> {new Date(expiresAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>

          <Section style={instructionsBox}>
            <Heading style={h2}>📥 Installation Steps</Heading>
            <Text style={listItem}>1. Open MetaTrader 5</Text>
            <Text style={listItem}>2. Go to Tools → Options → Expert Advisors</Text>
            <Text style={listItem}>3. Enable "Allow WebRequest for listed URL"</Text>
            <Text style={listItem}>4. Add: <code>https://mark8pips.vercel.app</code></Text>
            <Text style={listItem}>5. Install the EA and enter your license key</Text>
          </Section>

          <Button style={button} href="https://mark8pips.vercel.app/docs">
            View Full Documentation
          </Button>

          <Text style={footer}>
            Need help? Contact us at support@mark8pips.com
            <br />
            <a href="https://mark8pips.vercel.app" style={link}>Visit Mark8Pips</a>
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

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '20px 0 10px',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
}

const codeBox = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '8px',
  margin: '30px 40px',
  padding: '20px',
}

const codeLabel = {
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: 'bold',
  letterSpacing: '1px',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
}

const codeText = {
  color: '#ffffff',
  fontFamily: 'monospace',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '2px',
}

const instructionsBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  margin: '30px 40px',
  padding: '20px',
}

const listItem = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
}

const button = {
  backgroundColor: '#667eea',
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

const link = {
  color: '#667eea',
  textDecoration: 'underline',
}
