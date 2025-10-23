import * as crypto from 'crypto';
import * as https from 'https';
import { SnsMessageDto } from '../apis/emails/dto/emails.dto';

/**
 * Verifies the signature of an AWS SNS message
 * Reference: https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html
 */
export async function verifySnsSignature(message: SnsMessageDto): Promise<boolean> {
  try {
    // Check signature version
    if (!message.SignatureVersion || message.SignatureVersion !== '1') {
      console.warn('Invalid SNS signature version:', message.SignatureVersion);
      return false;
    }

    // Validate certificate URL to prevent SSRF attacks
    const certUrl = message.SigningCertURL;
    if (!isValidCertificateUrl(certUrl)) {
      console.warn('Invalid SNS certificate URL:', certUrl);
      return false;
    }

    // Fetch the certificate
    const certificate = await fetchCertificate(certUrl);
    if (!certificate) {
      console.warn('Failed to fetch SNS certificate');
      return false;
    }

    // Build the canonical string for signature verification
    const canonicalString = buildCanonicalString(message);

    // Verify the signature
    const verifier = crypto.createVerify('SHA1');
    verifier.update(canonicalString, 'utf8');
    const isValid = verifier.verify(certificate, message.Signature, 'base64');

    return isValid;
  } catch (error) {
    console.error('Error verifying SNS signature:', error);
    return false;
  }
}

/**
 * Validates that the certificate URL is from AWS SNS
 * Prevents SSRF attacks
 */
function isValidCertificateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Must be HTTPS
    if (parsed.protocol !== 'https:') {
      return false;
    }

    // Must be from AWS SNS domain
    const validHostPattern = /^sns\.[a-z0-9-]+\.amazonaws\.com$/;
    if (!validHostPattern.test(parsed.hostname)) {
      return false;
    }

    // Must end with the correct path
    if (!parsed.pathname.endsWith('.pem')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Fetches the certificate from AWS
 */
async function fetchCertificate(url: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: true }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch certificate: ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Builds the canonical string for signature verification
 * The fields and order depend on the message type
 */
function buildCanonicalString(message: SnsMessageDto): string {
  const messageType = message.Type;

  const fieldsByType: Record<string, string[]> = {
    Notification: ['Message', 'MessageId', 'Subject', 'Timestamp', 'TopicArn', 'Type'],
    SubscriptionConfirmation: ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'],
    UnsubscribeConfirmation: ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'],
  };

  const fields = fieldsByType[messageType] || [];
  let canonicalString = '';

  for (const field of fields) {
    if (message[field] !== undefined && message[field] !== null) {
      canonicalString += `${field}\n${message[field]}\n`;
    }
  }

  return canonicalString;
}
